import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

// Supabase Config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Multipliers for point calculation
const multipliers = {
  runs: 1,
  fifties: 5,
  centuries: 10,
  sixes: 2,
  fours: 1,
  wickets: 25,
  four_wkts: 10,
  five_wkts: 12,
  catches: 8,
  stumpings: 12,
  ducks: -3,
  maidens: 5,
  keeper_catches: 8,
  three_wkts: 4,  // Manual entry
  indirect: 6,    // Manual entry
  direct: 12,     // Manual entry
};

// ESPN Cricinfo URLs
const urls = {
  runs: "https://www.espncricinfo.com/records/tournament/batting-most-runs-career/icc-champions-trophy-2024-25-16814",
  wickets: "https://www.espncricinfo.com/records/tournament/bowling-most-wickets-career/icc-champions-trophy-2024-25-16814",
  dismissals: "https://www.espncricinfo.com/records/tournament/keeping-most-dismissals-career/icc-champions-trophy-2024-25-16814",
  catches: "https://www.espncricinfo.com/records/tournament/fielding-most-catches-career/icc-champions-trophy-2024-25-16814",
};

// Define captains and vice-captains
const captains = new Set(["Shubman Gill (IND)", "V Kohli (IND)", "H Klaasen (SA)", "KS Williamson (NZ)", "KA Maharaj (SA)"]); // 2x Points
const viceCaptains = new Set(["JC Buttler (ENG)", "RG Sharma (IND)", "TM Head (AUS)", "SPD Smith (AUS)", "BM Duckett (ENG)"]); // 1.5x Points
 

// Scrape function
async function scrapeData(url: string, type: string) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let records: any[] = [];

    $("table tbody tr").each((index, element) => {
      const cols = $(element)
        .find("td")
        .map((i, el) => $(el).text().trim())
        .toArray();

      if (cols.length > 0) {
        const player = cols[0]; // Player name
        const team = cols[1]; // Team name

        let record: any = { player, team };

        if (type === "runs") {
          record.matches = parseInt(cols[2]) || 0;
          record.runs = parseInt(cols[5]) || 0;
          record.hundreds = parseInt(cols[10]) || 0;
          record.fifties = parseInt(cols[11]) || 0;
          record.ducks = parseInt(cols[12]) || 0;
          record.fours = parseInt(cols[13]) || 0;
          record.sixes = parseInt(cols[14]) || 0;
        } else if (type === "wickets") {
          record.maidens = parseInt(cols[6]) || 0;
          record.wickets = parseInt(cols[8]) || 0;
          record.four_wkts = parseInt(cols[13]) || 0;
          record.five_wkts = parseInt(cols[14]) || 0;
        } else if (type === "dismissals") {
          record.keeper_catches = parseInt(cols[5]) || 0;
          record.stumpings = parseInt(cols[6]) || 0;
        } else if (type === "catches") {
          record.catches = parseInt(cols[4]) || 0;
        }

        records.push(record);
      }
    });

    return records;
  } catch (error) {
    console.error(`Scraping error for ${type}:`, error);
    return [];
  }
}

// Merge stats for the same player
function mergePlayerStats(data: any[]) {
  let mergedData: any = {};

  for (let entry of data) {
    const { player, team, ...stats } = entry;

    if (!mergedData[player]) {
      mergedData[player] = {
        player,
        team,
        matches: 0,
        runs: 0,
        hundreds: 0,
        fifties: 0,
        fours: 0,
        sixes: 0,
        wickets: 0,
        four_wkts: 0,
        five_wkts: 0,
        catches: 0,
        stumpings: 0,
        ducks: 0,
        keeper_catches: 0,
        maidens: 0,
        three_wkts: 0,
        indirect: 0,
        direct: 0,
        total_points: 0,
      };
    }

    // Sum up stats
    Object.keys(stats).forEach((key) => {
      mergedData[player][key] += stats[key];
    });
  }

  return Object.values(mergedData);
}

// Calculate points for each player
async function calculatePointsAndStore(players: any[]) {
  // Fetch manually added values for all players in one query
  const { data: manualStats, error } = await supabase
    .from("cricket_stats")
    .select("player, three_wkts, indirect, direct");

  if (error) {
    console.error("Error fetching manual stats:", error);
  }

  const manualStatsMap = manualStats?.reduce((acc, stat) => {
    acc[stat.player] = stat;
    return acc;
  }, {} as Record<string, any>) || {};

  for (const player of players) {
    if (!player.player) continue;

    let totalPoints =
      (player.runs || 0) * multipliers.runs +
      (player.fifties || 0) * multipliers.fifties +
      (player.hundreds || 0) * multipliers.centuries +
      (player.sixes || 0) * multipliers.sixes +
      (player.fours || 0) * multipliers.fours +
      (player.wickets || 0) * multipliers.wickets +
      (player.four_wkts || 0) * multipliers.four_wkts +
      (player.five_wkts || 0) * multipliers.five_wkts +
      (player.catches || 0) * multipliers.catches +
      (player.stumpings || 0) * multipliers.stumpings +
      (player.ducks || 0) * multipliers.ducks +
      (player.maidens || 0) * multipliers.maidens +
      (player.keeper_catches || 0) * multipliers.keeper_catches;

    // Apply manually added values
    if (manualStatsMap[player.player]) {
      totalPoints += (manualStatsMap[player.player].three_wkts || 0) * multipliers.three_wkts;
      totalPoints += (manualStatsMap[player.player].indirect || 0) * multipliers.indirect;
      totalPoints += (manualStatsMap[player.player].direct || 0) * multipliers.direct;
    }

    if (captains.has(player.player)) {
      totalPoints *= 2;
    } else if (viceCaptains.has(player.player)) {
      totalPoints *= 1.5;
    }

    player.total_points = totalPoints;
  }

  // Upsert player stats
  const { error: updateError } = await supabase.from("cricket_stats").upsert(players, { onConflict: "player" });

  if (updateError) {
    console.error("Error updating player points:", updateError);
  }
}

// API Route
export async function GET() {
  try {
    const allData = [...await scrapeData(urls.runs, "runs"), ...await scrapeData(urls.wickets, "wickets"), ...await scrapeData(urls.dismissals, "dismissals"), ...await scrapeData(urls.catches, "catches")];

    await calculatePointsAndStore(mergePlayerStats(allData));

    return NextResponse.json({ success: true, message: "Data updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}

