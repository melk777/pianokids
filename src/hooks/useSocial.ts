"use client";

import { useState, useCallback, useEffect } from "react";
import { createClientComponent } from "@/lib/supabase";
import { Profile } from "./useProfile";

export interface FriendshipData {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  friend_profile: Profile;
  isOnline?: boolean;
}

export function useSocial() {
  const supabase = createClientComponent();
  const [friends, setFriends] = useState<FriendshipData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendshipData[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // 1. Fetch data only when necessary (not when presence changes)
  const fetchSocialData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("friendships")
        .select(`
          *,
          sender:sender_id(*),
          receiver:receiver_id(*)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (error) throw error;

      const formattedFriends: FriendshipData[] = [];
      const formattedPending: FriendshipData[] = [];

      data.forEach((item: any) => {
        const isSender = item.sender_id === user.id;
        const friendProfile = isSender ? item.receiver : item.sender;
        
        const friendship: FriendshipData = {
          id: item.id,
          sender_id: item.sender_id,
          receiver_id: item.receiver_id,
          status: item.status,
          friend_profile: friendProfile
        };

        if (item.status === 'accepted') {
          formattedFriends.push(friendship);
        } else if (item.status === 'pending') {
          if (item.receiver_id === user.id) {
            formattedPending.push(friendship);
          }
        }
      });

      setFriends(formattedFriends);
      setPendingRequests(formattedPending);
    } catch (err) {
      console.error("Social error:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [supabase]);

  // 2. Combine friends with online status locally
  const friendsWithPresence = friends.map(f => ({
    ...f,
    isOnline: onlineUserIds.has(f.friend_profile.id)
  }));

  const searchUsers = async (query: string) => {
    if (query.length < 3) return [];
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${query}%`)
      .limit(5);
    
    if (error) return [];
    return data as Profile[];
  };

  const sendFriendRequest = async (receiverId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { error } = await supabase
      .from("friendships")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending'
      });

    if (error) {
      console.error("Error sending request:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const updateRequestStatus = async (friendshipId: string, newStatus: 'accepted' | 'blocked') => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: newStatus })
      .eq("id", friendshipId);

    if (error) return { success: false };
    fetchSocialData(false); // Update without showing loader
    return { success: true };
  };

  useEffect(() => {
    let active = true;
    let friendshipsChannel: any;
    let presenceChannel: any;

    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !active) return;
      const user = session.user;

      fetchSocialData();

      friendshipsChannel = supabase
        .channel('friendships_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
          if (active) fetchSocialData(false);
        })
        .subscribe();

      presenceChannel = supabase.channel('online_players', {
        config: { presence: { key: user.id } }
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          if (!active) return;
          const state = presenceChannel.presenceState();
          const onlineIds = new Set(Object.keys(state));
          setOnlineUserIds(onlineIds);
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED' && active) {
            await presenceChannel.track({ online_at: new Date().toISOString() });
          }
        });
    };

    setup();

    return () => {
      active = false;
      if (friendshipsChannel) supabase.removeChannel(friendshipsChannel);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, [fetchSocialData, supabase]);

  return {
    friends: friendsWithPresence,
    pendingRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    updateRequestStatus,
    refresh: fetchSocialData
  };
}
