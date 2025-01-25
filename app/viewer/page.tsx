'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import india from '@/public/india.jpeg';
import bangladesh from '@/public/bangladesh.jpeg';
import afghanistan from '@/public/afghanistan.jpeg';
import england from '@/public/england.jpeg';
import southafrica from '@/public/southafrica.jpeg';
import australia from '@/public/australia.jpeg';
import pakistan from '@/public/pakistan.jpeg';
import newzealand from '@/public/newzealand.jpeg';
import NavBarView from '@/app/usersviewers/NavBarView';
import Link from "next/link";



interface Player {
  id: number;
  name: string;
  team: string;
  role: string;
  basebid: number;
  soldto: string | null;
  sold: boolean | null;
  displayed: boolean | null;
  finalbid: number | null;
}

export default function LivePlayerView() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [unsoldPlayers, setUnsoldPlayers] = useState<Player[]>([]);
  const [showRemaining, setShowRemaining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeComponent, setActiveComponent] = useState<string>('Viewer');

  // Fetch the current live player from the liveplayer table
  const fetchLivePlayer = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('liveplayer')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('No live player is currently set.');
        } else {
          throw error;
        }
      } else {
        setCurrentPlayer(data);
        setShowRemaining(false); // Reset show remaining state
      }
    } catch (err) {
      console.error('Error fetching live player:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch remaining unsold players
  const fetchRemainingPlayers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('displayed', true)
        .is('sold', null);

      if (error) throw error;

      setUnsoldPlayers(data || []);
      setShowRemaining(true);
    } catch (err) {
      console.error('Error fetching remaining players:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch remaining players');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePlayer();

    // Optionally, add real-time subscription to listen to changes in the `liveplayer` table
    const subscription = supabase
      .channel('liveplayer_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'liveplayer' },
        () => fetchLivePlayer() // Refetch the live player on any change
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <main className="min-h-screen bg-white text-black  ">
        
        <div className=" text-center">
      <NavBarView/>
            </div>
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mt-4">
            {error}
          </div>
        )}
        <div className="bg-gray-100 rounded-xl shadow-lg p-6 border border-gray-300 w-fit place-self-center m-24">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : showRemaining ? (
            <table className="w-fit max-w-96 table-auto border-collapse border border-black">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black px-4 py-2">Name</th>
                  <th className="border border-black px-4 py-2">Role</th>
                  <th className="border border-black px-4 py-2">Team</th>
                  <th className="border border-black px-4 py-2">Base Bid</th>
                  
                </tr>
              </thead>
              <tbody>
                {unsoldPlayers.map((player) => (
                  <tr key={player.id}>
                    <td className="border border-black px-4 py-2">{player.name}</td>
                    <td className="border border-black px-4 py-2">{player.role}</td>
                    <td className="border border-gray-300 px-4 py-2 relative" style={{ height: '6rem' }}>
                              {/* Bottom Layer: Flag */}
                              {player.team === 'India' && (
                                <Image
                                  src={india}
                                  alt="India Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'Australia' && (
                                <Image
                                  src={australia}
                                  alt="Australia Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'England' && (
                                <Image
                                  src={england}
                                  alt="England Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'South Africa' && (
                                <Image
                                  src={southafrica}
                                  alt="South Africa Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'Pakistan' && (
                                <Image
                                  src={pakistan}
                                  alt="Pakistan Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'Bangladesh' && (
                                <Image
                                  src={bangladesh}
                                  alt="Bangladesh Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'Afghanistan' && (
                                <Image
                                  src={afghanistan}
                                  alt="Afghanistan Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {player.team === 'New Zealand' && (
                                <Image
                                  src={newzealand}
                                  alt="New Zealand Team"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              {/* Middle Layer: Black Overlay */}
                              <div className="absolute inset-0 bg-black/50"></div>

                              {/* Top Layer: Text */}
                              <span className="relative z-10 text-white font-bold text-center block">
                                {player.team}
                              </span>
                            </td>
                    <td className="border border-black px-4 py-2">{player.basebid}</td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          ) : currentPlayer ? (
            <div>
              <h2 className="text-3xl place-self-center font-bold mb-4">{currentPlayer.name}</h2>
              <div className="flex justify-between items-center space-x-4 mb-4">
                <h2 className="text-xl">Team: <span className="font-bold">{currentPlayer.team}</span></h2>
                 {/* Conditional Rendering of Images */}
                 {currentPlayer.team === 'India' && (
                      <Image
                        src={india}
                        alt="India Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'Australia' && (
                      <Image
                        src={australia}
                        alt="Australia Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'England' && (
                      <Image
                        src={england}
                        alt="England Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'Pakistan' && (
                      <Image
                        src={pakistan}
                        alt="Pakistan Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'South Africa' && (
                      <Image
                        src={southafrica}
                        alt="South Africa Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'New Zealand' && (
                      <Image
                        src={newzealand}
                        alt="New Zealand Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'Bangladesh' && (
                      <Image
                        src={bangladesh}
                        alt="Bangladesh Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                    {currentPlayer.team === 'Afghanistan' && (
                      <Image
                        src={afghanistan}
                        alt="Afghanistan Team"
                        className="w-48 h-28 object-cover rounded-lg mb-4 mt-4"
                      />
                    )}
                      
                  </div>
                  <div className="flex justify-between items-center space-x-4 mb-4">
                    <h2 className="text-xl">Role: <span className="font-bold">{currentPlayer.role}</span> </h2>
                    <h2 className="text-3xl ">₹<span className="font-bold text-3xl mr-8">{currentPlayer.basebid}</span>
                    </h2>
                    </div>
                    </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl font-bold text-gray-700">No live player is currently available.</p>
              <button
                onClick={fetchRemainingPlayers}
                className="mt-4 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Show Remaining Players
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
