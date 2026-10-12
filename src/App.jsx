import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Auth from "./components/Auth";
import "./App.css";

function App() {
  const [activeMenu, setActiveMenu] = useState("Beranda");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const postRefs = useRef({});
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");

  const [exploreSearch, setExploreSearch] = useState("");
  const [exploreSort, setExploreSort] = useState("terbaru");
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const unreadNotificationCount = notifications.filter(
  (notification) => !notification.is_read
  ).length;

  const [notificationLoading, setNotificationLoading] = useState(false); 

  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [posts, setPosts] = useState([]);

  const exploredPosts = posts
  .filter((post) => {
    const keyword = exploreSearch.trim().toLowerCase();

    if (!keyword) return true;

    return (
      post.content?.toLowerCase().includes(keyword) ||
      post.user?.toLowerCase().includes(keyword) ||
      post.username?.toLowerCase().includes(keyword)
    );
  })
  .sort((a, b) => {
    if (exploreSort === "terpopuler") {
      return (b.likes || 0) - (a.likes || 0);
    }

    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );
  });

const extractTopics = (content) => {
  if (!content) return [];

  const matches = content.match(/#[a-zA-Z0-9_]+/g);

  return matches
    ? matches.map((topic) => topic.toLowerCase())
    : [];
};

const topics = {};

posts.forEach((post) => {
  const postTopics = extractTopics(post.content);

  postTopics.forEach((topic) => {
    if (!topics[topic]) {
      topics[topic] = {
        name: topic,
        count: 0,
      };
    }

    topics[topic].count += 1;
  });
});

const topicList = Object.values(topics).sort(
  (a, b) => b.count - a.count
);

  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");

  const [likes, setLikes] = useState({});
  const [likeLoading, setLikeLoading] = useState({});

  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);

  const [showPostForm, setShowPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postCategory, setPostCategory] = useState("Diskusi");
  const [postContent, setPostContent] = useState("");
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postSubmitError, setPostSubmitError] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState("");

  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostCategory, setEditPostCategory] = useState("Diskusi");
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostSaving, setEditPostSaving] = useState(false);
  const [editPostError, setEditPostError] = useState("");
  const [editPostImage, setEditPostImage] = useState(null);
  const [editPostImagePreview, setEditPostImagePreview] = useState("");
  const [removePostImage, setRemovePostImage] = useState(false);
  
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [communitiesError, setCommunitiesError] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [communityMembersLoading, setCommunityMembersLoading] = useState(false);
  const [communityActionLoading, setCommunityActionLoading] = useState(false);
  const [communityMessage, setCommunityMessage] = useState("");

  
const fetchCommunities = async () => {
  setCommunitiesLoading(true);
  setCommunitiesError("");

  const { data: communityData, error: communityError } =
    await supabase
      .from("communities")
      .select("id, name, slug, description, icon, created_at")
      .order("name", { ascending: true });

  if (communityError) {
    console.error("Gagal mengambil komunitas:", {
  message: communityError.message,
  code: communityError.code,
  details: communityError.details,
  hint: communityError.hint,
  status: communityError.status,
});
    setCommunitiesError(communityError.message);
    setCommunitiesLoading(false);
    return;
  }

  const { data: memberData, error: memberError } = await supabase
    .from("community_members")
    .select("community_id, user_id");

  if (memberError) {
    console.error("Gagal mengambil anggota komunitas:", memberError);
    setCommunitiesError(memberError.message);
    setCommunitiesLoading(false);
    return;
  }

  const counts = {};

  (memberData || []).forEach((member) => {
    counts[member.community_id] =
      (counts[member.community_id] || 0) + 1;
  });

  setCommunities(
    (communityData || []).map((community) => ({
      ...community,
      member_count: counts[community.id] || 0,
      is_member: (memberData || []).some(
        (member) =>
          member.community_id === community.id &&
          member.user_id === session?.user?.id
      ),
    }))
  );

  setCommunitiesLoading(false);
};

  
useEffect(() => {
  if (!session?.user?.id) return;

  fetchCommunities();
}, [session?.user?.id]);

const handleJoinCommunity = async (community) => {
  if (!session?.user?.id) {
    setCommunityMessage("Silakan login terlebih dahulu.");
    return;
  }

  setCommunityActionLoading(true);
  setCommunityMessage("");

  const { error } = await supabase
    .from("community_members")
    .insert({
      community_id: community.id,
      user_id: session.user.id,
    });

  if (error) {
    console.error("Gagal bergabung ke komunitas:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status,
    });

    setCommunityMessage(
      error.code === "23505"
        ? "Kamu sudah bergabung dengan komunitas ini."
        : `Gagal bergabung: ${error.message}`
    );
  } else {
    setCommunityMessage(
      `Berhasil bergabung dengan ${community.name}!`
    );

    await fetchCommunities();
  }

  setCommunityActionLoading(false);
};


const handleLeaveCommunity = async (community) => {
  if (!session?.user?.id || communityActionLoading) return;

  const confirmed = window.confirm(
    `Yakin ingin keluar dari ${community.name}?`
  );

  if (!confirmed) return;

  setCommunityActionLoading(true);
  setCommunityMessage("");

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", community.id)
    .eq("user_id", session.user.id);

  if (error) {
    console.error("Gagal keluar dari komunitas:", error);
    setCommunityMessage(`Gagal keluar: ${error.message}`);
  } else {
    setCommunityMessage(`Kamu sudah keluar dari ${community.name}.`);
  }

  await fetchCommunities();
  setCommunityActionLoading(false);
};

const handleOpenCommunity = async (community) => {
  setSelectedCommunity(community);
  setCommunityMembers([]);
  setCommunityMessage("");
  setCommunityMembersLoading(true);
  setActiveMenu("Detail Komunitas");

  const { data: memberships, error: membershipError } =
    await supabase
      .from("community_members")
      .select("user_id, joined_at")
      .eq("community_id", community.id)
      .order("joined_at", { ascending: true });

  if (membershipError) {
    console.error("Gagal mengambil anggota:", membershipError);
    setCommunityMessage(
      `Gagal mengambil anggota: ${membershipError.message}`
    );
    setCommunityMembersLoading(false);
    return;
  }

  const userIds = (memberships || []).map((member) => member.user_id);
  let profiles = [];

  if (userIds.length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, username")
      .in("id", userIds);

    if (error) {
      console.error("Gagal mengambil profil anggota:", error);
      setCommunityMessage(
        `Gagal mengambil profil anggota: ${error.message}`
      );
    } else {
      profiles = data || [];
    }
  }

  const profileMap = Object.fromEntries(
    profiles.map((profile) => [profile.id, profile])
  );

  setCommunityMembers(
    (memberships || []).map((member) => ({
      ...member,
      profile: profileMap[member.user_id] || null,
    }))
  );

  setCommunityMembersLoading(false);
};
  
const handleAvatarChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    setAvatarMessage("Gunakan foto JPG, PNG, atau WEBP.");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    setAvatarMessage("Ukuran foto maksimal 2 MB.");
    return;
  }

  setAvatarFile(file);
  setAvatarPreview(URL.createObjectURL(file));
  setAvatarMessage("");
};


const handleSaveAvatar = async () => {
  if (!session?.user?.id) {
    setAvatarMessage("Sesi login berakhir. Silakan login kembali.");
    return;
  }

  if (!avatarFile) {
    setAvatarMessage("Pilih foto terlebih dahulu.");
    return;
  }

  setAvatarLoading(true);
  setAvatarMessage("");

  let uploadedPath = null;

  try {
    const userId = session.user.id;
    const extension = avatarFile.name.split(".").pop()?.toLowerCase();

    if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
      throw new Error("Format foto harus JPG, JPEG, PNG, atau WEBP.");
    }

    const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;

    const { data: uploadData, error: uploadError } =
      await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, {
          contentType: avatarFile.type,
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) throw uploadError;

    uploadedPath = uploadData.path;

    const { data: publicData } = supabase.storage
      .from("avatars")
      .getPublicUrl(uploadData.path);

    const { data: updatedProfile, error: profileError } =
      await supabase
        .from("profiles")
        .update({ avatar_url: publicData.publicUrl })
        .eq("id", userId)
        .select("id, full_name, username, bio, avatar_url")
        .maybeSingle();

    if (profileError) throw profileError;

    if (!updatedProfile) {
      throw new Error(
        "Profil tidak ditemukan atau tidak dapat diperbarui. Periksa kebijakan RLS."
      );
    }

    setProfile(updatedProfile);
    setAvatarFile(null);
    setAvatarPreview("");
    setAvatarMessage("Foto profil berhasil diperbarui!");

    const fileInput = document.getElementById("avatar-file-input");
    if (fileInput) fileInput.value = "";

    // File sudah tersimpan; jangan hapus file ini.
    uploadedPath = null;
  } catch (error) {
    console.error("Gagal menyimpan foto profil:", error);

    setAvatarMessage(
      `Gagal menyimpan foto: ${error.message || "Terjadi kesalahan."}`
    );

    // Bersihkan file baru jika pembaruan profil gagal.
    if (uploadedPath) {
      const { error: cleanupError } = await supabase.storage
        .from("avatars")
        .remove([uploadedPath]);

      if (cleanupError) {
        console.error("Gagal membersihkan file avatar:", cleanupError);
      }
    }
  } finally {
    setAvatarLoading(false);
  }
};

const handleDeleteAvatar = async () => {
  if (!session?.user?.id) {
    setAvatarMessage("Silakan login kembali.");
    return;
  }

  const currentAvatarUrl = profile?.avatar_url;

  if (!currentAvatarUrl) {
    setAvatarMessage("Foto profil sudah dihapus.");
    return;
  }

  const confirmed = window.confirm(
    "Apakah kamu yakin ingin menghapus foto profil?"
  );

  if (!confirmed) return;

  setAvatarLoading(true);
  setAvatarMessage("");

  try {
    const userId = session.user.id;

    const { data: updatedProfile, error: updateError } =
      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId)
        .select("id, full_name, username, bio, avatar_url")
        .maybeSingle();

    if (updateError) throw updateError;

    if (!updatedProfile) {
      throw new Error(
        "Profil tidak dapat diperbarui. Periksa kebijakan RLS."
      );
    }

    setProfile(updatedProfile);
    setAvatarFile(null);
    setAvatarPreview("");

    const input = document.getElementById("avatar-file-input");
    if (input) input.value = "";

    // Hapus file Storage milik pengguna ini jika URL-nya cocok.
    try {
      const marker = "/storage/v1/object/public/avatars/";
      const url = new URL(currentAvatarUrl);
      const markerIndex = url.pathname.indexOf(marker);

      if (markerIndex !== -1) {
        const filePath = decodeURIComponent(
          url.pathname.slice(markerIndex + marker.length)
        );

        if (filePath.startsWith(`${userId}/`)) {
          const { error: storageError } = await supabase.storage
            .from("avatars")
            .remove([filePath]);

          if (storageError) {
            console.warn("Gagal menghapus file Storage:", storageError);
          }
        }
      }
    } catch (storageError) {
      console.warn("Pembersihan file Storage gagal:", storageError);
    }

    setAvatarMessage("Foto profil berhasil dihapus.");
  } catch (error) {
    console.error("Gagal menghapus foto profil:", error);
    setAvatarMessage(
      error.message || "Gagal menghapus foto profil."
    );
  } finally {
    setAvatarLoading(false);
  }
};

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
  if (!session?.user?.id) {
    setProfile(null);
    return;
  }

  const fetchProfile = async () => {
    setProfileLoading(true);

    
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, bio, avatar_url")
    .eq("id", session.user.id)
    .single();


    if (error) {
      console.error("Gagal mengambil profil:", error);
      setProfile(null);
    } else {
      setProfile(data);
    }

    setProfileLoading(false);
  };

  fetchProfile();
}, [session]);

useEffect(() => {
  if (!session?.user?.id) {
    setNotifications([]);
    return;
  }

  const fetchNotifications = async () => {
    setNotificationLoading(true);

    // 1. Ambil notifikasi
    const { data: notificationData, error: notificationError } =
      await supabase
        .from("notifications")
        .select(`
          id,
          user_id,
          actor_id,
          post_id,
          type,
          message,
          is_read,
          created_at
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

    if (notificationError) {
      console.error(
        "Gagal mengambil notifikasi:",
        notificationError
      );

      setNotifications([]);
      setNotificationLoading(false);
      return;
    }

    // 2. Ambil ID actor
    const actorIds = [
      ...new Set(
        (notificationData || []).map(
          (notification) => notification.actor_id
        )
      ),
    ];

    let actorProfiles = [];

    // 3. Ambil profil actor dari tabel profiles
    if (actorIds.length > 0) {
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", actorIds);

      if (profileError) {
        console.error(
          "Gagal mengambil profil actor:",
          profileError
        );
      } else {
        actorProfiles = profileData || [];
      }
    }

    // 4. Buat map profil berdasarkan ID
    const actorMap = {};

    actorProfiles.forEach((actor) => {
      actorMap[actor.id] = actor;
    });

    // 5. Gabungkan profil actor dengan notifikasi
    const formattedNotifications = (notificationData || []).map(
      (notification) => ({
        ...notification,
        actor: actorMap[notification.actor_id] || null,
      })
    );

    setNotifications(formattedNotifications);
    setNotificationLoading(false);
  };

  fetchNotifications();
}, [session]);

useEffect(() => {
  if (!session?.user?.id) return;

  const userId = session.user.id;

  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log("Perubahan notifikasi realtime:", payload);

        // Notifikasi baru
        if (payload.eventType === "INSERT") {
          const notification = payload.new;

          const { data: actorProfile, error } = await supabase
            .from("profiles")
            .select("id, full_name, username")
            .eq("id", notification.actor_id)
            .maybeSingle();

          if (error) {
            console.error("Gagal mengambil profil actor:", error);
          }

          const formattedNotification = {
            ...notification,
            actor: actorProfile || null,
          };

          setNotifications((current) => {
            if (current.some((item) => item.id === notification.id)) {
              return current;
            }

            return [formattedNotification, ...current];
          });
        }

        // Notifikasi dihapus
        if (payload.eventType === "DELETE") {
          const deletedId = payload.old?.id;

          if (deletedId != null) {
            setNotifications((current) =>
              current.filter((item) => item.id !== deletedId)
            );
          }
        }

        // Notifikasi diperbarui, misalnya ditandai sudah dibaca
        if (payload.eventType === "UPDATE") {
          const updated = payload.new;

          setNotifications((current) =>
            current.map((item) =>
              item.id === updated.id
                ? { ...item, ...updated }
                : item
            )
          );
        }
      }
    )
    .subscribe((status) => {
      console.log("Status realtime notifications:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [session?.user?.id]);

const markNotificationsAsRead = async () => {
  if (!session?.user?.id) return;

  const unreadNotifications = notifications.filter(
    (notification) => !notification.is_read
  );

  if (unreadNotifications.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("user_id", session.user.id)
    .eq("is_read", false);

  if (error) {
    console.error(
      "Gagal menandai semua notifikasi sebagai sudah dibaca:",
      error
    );
    return;
  }

  setNotifications((current) =>
    current.map((notification) => ({
      ...notification,
      is_read: true,
    }))
  );
};

const handleNotificationClick = async (notification) => {
  if (!session?.user?.id) return;

  // Tandai notifikasi ini sebagai sudah dibaca
  if (!notification.is_read) {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", notification.id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error(
        "Gagal menandai notifikasi sebagai sudah dibaca:",
        error
      );
    }
  }

  // Update tampilan notifikasi
  setNotifications((current) =>
    current.map((item) =>
      item.id === notification.id
        ? { ...item, is_read: true }
        : item
    )
  );

  // Kalau notifikasi memiliki post_id,
  // arahkan ke Beranda dan pilih postingan tersebut
  if (notification.post_id) {
    setSelectedPostId(notification.post_id);
    setActiveMenu("Beranda");
  }
};


  useEffect(() => {
  if (!session) {
    setPosts([]);
    setPostsLoading(false);
    return;
  }

  const fetchPosts = async () => {
    setPostsLoading(true);
    setPostsError("");

    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (postError) {
      console.error("Gagal mengambil posts:", postError);
      setPostsError(postError.message);
      setPostsLoading(false);
      return;
    }

    const userIds = [
      ...new Set(postData.map((post) => post.user_id)),
    ];

    let profiles = [];

    if (userIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

      if (profileError) {
        console.error("Gagal mengambil profiles:", profileError);
      } else {
        profiles = profileData || [];
      }
    }

    const profileMap = {};

    profiles.forEach((profile) => {
      profileMap[profile.id] = profile;
    });

    const postIds = postData.map((post) => post.id);

let likeData = [];

if (postIds.length > 0) {
  const { data, error } = await supabase
    .from("post_likes")
    .select("post_id, user_id")
    .in("post_id", postIds);

  if (error) {
    console.error("Gagal mengambil likes:", error);
  } else {
    likeData = data || [];
  }
}

const likeCounts = {};

const userLikes = {};

likeData.forEach((like) => {
  likeCounts[like.post_id] =
    (likeCounts[like.post_id] || 0) + 1;

  if (like.user_id === session.user.id) {
    userLikes[like.post_id] = true;
  }
});

const commentCounts = {};

if (postIds.length > 0) {
  const { data: commentData, error: commentError } = await supabase
    .from("comments")
    .select("id, post_id, user_id, content, created_at")
    .in("post_id", postIds);

  if (commentError) {
    console.error("Gagal mengambil jumlah komentar:", commentError);
  } else {
    (commentData || []).forEach((comment) => {
      commentCounts[comment.post_id] =
        (commentCounts[comment.post_id] || 0) + 1;
    });
  }
}
const formattedPosts = postData.map((post) => {
  const profile = profileMap[post.user_id];

  return {
    ...post,
    user: profile?.full_name || "Pengguna Ruang Kita",
    username: profile?.username
      ? `@${profile.username}`
      : "@user",
    avatar_url: profile?.avatar_url || null,
    comments: commentCounts[post.id] || 0,
    likes: likeCounts[post.id] || 0,
  };
});

setLikes(userLikes);

    setPosts(formattedPosts);
    setPostsLoading(false);
  };

  fetchPosts();
}, [session]);

useEffect(() => {
  if (!selectedPostId) return;

  const postElement = postRefs.current[selectedPostId];

  if (postElement) {
    postElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    const timer = setTimeout(() => {
      setSelectedPostId(null);
    }, 2500);

    return () => clearTimeout(timer);
  }
}, [selectedPostId, posts]);

useEffect(() => {
  if (postsLoading || posts.length === 0) return;

  const params = new URLSearchParams(window.location.search);
  const sharedPostId = params.get("post");

  if (!sharedPostId) return;

  const targetPost = posts.find(
    (post) => String(post.id) === String(sharedPostId)
  );

  if (targetPost) {
    setActiveMenu("Beranda");
    setSelectedPostId(targetPost.id);

    setTimeout(() => {
      postRefs.current[targetPost.id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300);
  }
}, [posts, postsLoading]);

const handleOpenProfileForm = () => {
  console.log("EDIT PROFIL DIKLIK");

  setProfileName(profile?.full_name || "");
  setProfileUsername(profile?.username || "");
  setProfileBio(profile?.bio || "");

  setProfileError("");
  setShowProfileForm(true);
};

const handleUpdateProfile = async (event) => {
  event.preventDefault();

  if (!profileName.trim()) {
    setProfileError("Nama lengkap wajib diisi.");
    return;
  }

  if (!profileUsername.trim()) {
    setProfileError("Username wajib diisi.");
    return;
  }

  setProfileSaving(true);
  setProfileError("");

  try {
    const {
      data: { session: currentSession },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !currentSession?.user?.id) {
      setProfileError("Sesi login berakhir. Silakan login kembali.");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: profileName.trim(),
        username: profileUsername.trim().toLowerCase(),
        bio: profileBio.trim(),
      })
      .eq("id", currentSession.user.id)
      .select()
      .single();

    if (error) {
      console.error("Gagal memperbarui profil:", error);
      setProfileError(error.message);
      return;
    }

    setProfile(data);

    // Perbarui identitas pemilik postingan di tampilan
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.user_id === currentSession.user.id
          ? {
              ...post,
              user: data.full_name || "Pengguna Ruang Kita",
              username: data.username
                ? `@${data.username}`
                : "@user",
            }
          : post
      )
    );

    setProfileError("");
    setShowProfileForm(false);
  } catch (error) {
    console.error("Kesalahan saat memperbarui profil:", error);
    setProfileError(
      error.message || "Gagal memperbarui profil."
    );
  } finally {
    setProfileSaving(false);
  }
};




const handleCreatePost = async (event) => {
  event.preventDefault();

  if (!session?.user?.id) {
    setPostSubmitError("Kamu harus login terlebih dahulu.");
    return;
  }

  if (!postTitle.trim() || !postContent.trim()) {
    setPostSubmitError("Judul dan isi postingan wajib diisi.");
    return;
  }

  setPostSubmitting(true);
  setPostSubmitError("");

  let uploadedImagePath = null;

  try {
    let imageUrl = null;

    // 1. Upload gambar jika pengguna memilih gambar
    if (postImage) {
      const fileExt =
        postImage.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from("post-images")
          .upload(filePath, postImage, {
            contentType: postImage.type,
            upsert: false,
          });

      if (uploadError) {
        throw new Error(
          `Gagal mengunggah gambar: ${uploadError.message}`
        );
      }

      uploadedImagePath = uploadData.path;

      // 2. Ambil URL publik gambar
      const { data: publicUrlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(uploadData.path);

      imageUrl = publicUrlData.publicUrl;
    }

    // 3. Simpan postingan dan URL gambar ke database
    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: session.user.id,
        category: postCategory,
        title: postTitle.trim(),
        content: postContent.trim(),
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `Gagal membuat postingan: ${error.message}`
      );
    }

    // 4. Tambahkan postingan baru ke tampilan
    const newPost = {
      ...data,
      user: profile?.full_name || "Pengguna Ruang Kita",
      username: profile?.username
        ? `@${profile.username}`
        : "@user",
      comments: 0,
      likes: 0,
      avatar_url: profile?.avatar_url || null,
    };

    setPosts((currentPosts) => [newPost, ...currentPosts]);

    // 5. Bersihkan form setelah berhasil
    setPostTitle("");
    setPostCategory("Diskusi");
    setPostContent("");
    setPostImage(null);

    if (postImagePreview) {
      URL.revokeObjectURL(postImagePreview);
    }

    setPostImagePreview("");
    setShowPostForm(false);
  } catch (error) {
    console.error("Gagal membuat postingan:", error);
    setPostSubmitError(error.message || "Terjadi kesalahan.");

    // Bersihkan file yang baru diunggah jika penyimpanan postingan gagal
    if (uploadedImagePath) {
      const { error: cleanupError } = await supabase.storage
        .from("post-images")
        .remove([uploadedImagePath]);

      if (cleanupError) {
        console.error(
          "Gagal membersihkan gambar yang tidak terpakai:",
          cleanupError
        );
      }
    }
  } finally {
    setPostSubmitting(false);
  }
};


const handleSharePost = async (postId) => {
  const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;

  try {
    await navigator.clipboard.writeText(shareUrl);
    alert("Link postingan berhasil disalin!");
  } catch (error) {
    console.error("Gagal menyalin link:", error);
    window.prompt("Salin link postingan berikut:", shareUrl);
  }
};

const handleDeletePost = async (postId) => {
  if (!session?.user?.id) {
    alert("Kamu harus login terlebih dahulu.");
    return;
  }

  const confirmed = window.confirm(
    "Apakah kamu yakin ingin menghapus postingan ini?"
  );

  if (!confirmed) return;

  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", session.user.id)
    .select("id");

  if (error) {
    console.error("Gagal menghapus postingan:", error);
    alert(`Gagal menghapus postingan: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    alert(
      "Postingan tidak terhapus. Periksa kepemilikan postingan dan kebijakan RLS Supabase."
    );
    return;
  }

  setPosts((currentPosts) =>
    currentPosts.filter((post) => post.id !== postId)
  );

  setComments((current) => {
    const updated = { ...current };
    delete updated[postId];
    return updated;
  });

  setLikes((current) => {
    const updated = { ...current };
    delete updated[postId];
    return updated;
  });

  setOpenComments((current) => {
    const updated = { ...current };
    delete updated[postId];
    return updated;
  });
};

const handleOpenEditPost = (post) => {
  setEditingPostId(post.id);
  setEditPostTitle(post.title || "");
  setEditPostCategory(post.category || "Diskusi");
  setEditPostContent(post.content || "");
  setEditPostImage(null);
  setEditPostImagePreview("");
  setRemovePostImage(false);
  setEditPostError("");
};

const handleRemovePostImage = async (post) => {
  if (!session?.user?.id) {
    alert("Silakan login terlebih dahulu.");
    return;
  }

  if (!window.confirm("Hapus gambar dari postingan ini?")) {
    return;
  }

  const { data, error } = await supabase
    .from("posts")
    .update({ image_url: null })
    .eq("id", post.id)
    .eq("user_id", session.user.id)
    .select()
    .maybeSingle();

  if (error || !data) {
    alert(
      `Gagal menghapus gambar: ${
        error?.message || "Periksa izin RLS Supabase."
      }`
    );
    return;
  }

  setPosts((currentPosts) =>
    currentPosts.map((item) =>
      item.id === post.id
        ? { ...item, image_url: null }
        : item
    )
  );

  alert("Gambar berhasil dihapus dari postingan.");
};

const handleSaveEditPost = async (event, postId) => {
  event.preventDefault();

  if (!session?.user?.id) {
    setEditPostError("Silakan login kembali.");
    return;
  }

  if (!editPostTitle.trim() || !editPostContent.trim()) {
    setEditPostError("Judul dan isi postingan wajib diisi.");
    return;
  }

  setEditPostSaving(true);
  setEditPostError("");

  let uploadedImagePath = null;

  try {
    const currentPost = posts.find((post) => post.id === postId);

    if (!currentPost || currentPost.user_id !== session.user.id) {
      throw new Error("Postingan tidak ditemukan atau bukan milikmu.");
    }

    // Pertahankan gambar lama jika tidak ada perubahan.
    let imageUrl = currentPost.image_url || null;

    // Jika pengguna meminta hapus gambar.
    if (removePostImage) {
      imageUrl = null;
    }

    // Jika pengguna memilih gambar baru, unggah ke Storage.
    if (editPostImage) {
      if (!editPostImage.type.startsWith("image/")) {
        throw new Error("File yang dipilih harus berupa gambar.");
      }

      const fileExt =
        editPostImage.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from("post-images")
          .upload(filePath, editPostImage, {
            contentType: editPostImage.type,
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      uploadedImagePath = uploadData.path;

      const { data: publicUrlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(uploadData.path);

      imageUrl = publicUrlData.publicUrl;
    }

    // Simpan perubahan postingan dan URL gambar.
    const { data, error } = await supabase
      .from("posts")
      .update({
        title: editPostTitle.trim(),
        category: editPostCategory,
        content: editPostContent.trim(),
        image_url: imageUrl,
      })
      .eq("id", postId)
      .eq("user_id", session.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Perubahan gagal disimpan. Periksa izin RLS Supabase."
      );
    }

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId ? { ...post, ...data } : post
      )
    );

    setEditingPostId(null);
    setEditPostImage(null);
    setRemovePostImage(false);

    if (editPostImagePreview) {
      URL.revokeObjectURL(editPostImagePreview);
    }

    setEditPostImagePreview("");
    setEditPostError("");
  } catch (error) {
    console.error("Gagal mengedit postingan:", error);
    setEditPostError(
      error.message || "Gagal menyimpan perubahan."
    );

    // Bersihkan file baru jika upload berhasil tetapi penyimpanan gagal.
    if (uploadedImagePath) {
      const { error: cleanupError } = await supabase.storage
        .from("post-images")
        .remove([uploadedImagePath]);

      if (cleanupError) {
        console.error("Gagal membersihkan gambar:", cleanupError);
      }
    }
  } finally {
    setEditPostSaving(false);
  }
};

const toggleComments = async (postId) => {
  const isOpen = openComments[postId];

  setOpenComments((current) => ({
    ...current,
    [postId]: !isOpen,
  }));

  // Jika ditutup atau komentar sudah pernah dimuat, hentikan.
  if (isOpen || comments[postId]) {
    return;
  }

  setCommentLoading((current) => ({
    ...current,
    [postId]: true,
  }));

  try {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    const commentData = data || [];

    const userIds = [
      ...new Set(commentData.map((comment) => comment.user_id)),
    ];

    let commentProfiles = [];

    if (userIds.length > 0) {
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .in("id", userIds);

      if (profileError) {
        console.error(
          "Gagal mengambil profil komentar:",
          profileError
        );
      } else {
        commentProfiles = profileData || [];
      }
    }

    const commentProfileMap = {};

    commentProfiles.forEach((profile) => {
      commentProfileMap[profile.id] = profile;
    });

    const formattedComments = commentData.map((comment) => {
      const profile = commentProfileMap[comment.user_id];

      return {
        ...comment,
        user: profile?.full_name || "Pengguna Ruang Kita",
        username: profile?.username
          ? `@${profile.username}`
          : "@user",
      };
    });

    setComments((current) => ({
      ...current,
      [postId]: formattedComments,
    }));
  } catch (error) {
    console.error("Gagal mengambil komentar:", error);

    setComments((current) => ({
      ...current,
      [postId]: [],
    }));
  } finally {
    setCommentLoading((current) => ({
      ...current,
      [postId]: false,
    }));
  }
};

const handleAddComment = async (postId) => {
  const content = commentInputs[postId]?.trim();

  if (!content) {
    return;
  }

  if (!session?.user?.id) {
    return;
  }

  setCommentLoading((current) => ({
    ...current,
    [postId]: true,
  }));

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: session.user.id,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat komentar:", error);
    setCommentLoading((current) => ({
      ...current,
      [postId]: false,
    }));
    return;
  }

const post = posts.find((p) => p.id === postId);

if (post && post.user_id !== session.user.id) {
  await supabase
    .from("notifications")
    .insert({
      user_id: post.user_id,
      actor_id: session.user.id,
      post_id: postId,
      type: "comment",
      message: "mengomentari postingan Anda"
    });
}

const newComment = {
  ...data,
  user: profile?.full_name || "Pengguna Ruang Kita",
  username: profile?.username
    ? `@${profile.username}`
    : "@user",
};

setComments((current) => ({
  ...current,
  [postId]: [...(current[postId] || []), newComment],
}));

setPosts((currentPosts) =>
  currentPosts.map((post) =>
    post.id === postId
      ? {
          ...post,
          comments: (post.comments || 0) + 1,
        }
      : post
  )
);

  setCommentInputs((current) => ({
    ...current,
    [postId]: "",
  }));

  setCommentLoading((current) => ({
    ...current,
    [postId]: false,
  }));
};

  
const handleAddReply = async (postId, parentCommentId) => {
  const content = replyInputs[parentCommentId]?.trim();

  if (!content || !session?.user?.id) return;

  setCommentLoading((current) => ({
    ...current,
    [postId]: true,
  }));

  try {
    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: session.user.id,
        content,
        parent_comment_id: parentCommentId,
      })
      .select()
      .single();

    if (error) throw error;

    const newReply = {
      ...data,
      user: profile?.full_name || "Pengguna Ruang Kita",
      username: profile?.username
        ? `@${profile.username}`
        : "@user",
    };

    setComments((current) => ({
      ...current,
      [postId]: [
        ...(current[postId] || []),
        newReply,
      ],
    }));

    setReplyInputs((current) => ({
      ...current,
      [parentCommentId]: "",
    }));

    setReplyingTo(null);
  } catch (error) {
    console.error("Gagal mengirim balasan:", error);
    alert(`Gagal mengirim balasan: ${error.message}`);
  } finally {
    setCommentLoading((current) => ({
      ...current,
      [postId]: false,
    }));
  }
};

const handleDeleteComment = async (postId, commentId) => {
  if (!session?.user?.id) {
    alert("Kamu harus login terlebih dahulu.");
    return;
  }

  console.log("DELETE COMMENT DEBUG:", {
    postId,
    commentId,
    userId: session.user.id,
  });

  const { data: deletedComments, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", session.user.id)
    .select();

  console.log("DELETE COMMENT RESULT:", {
    deletedComments,
    error,
  });

  if (error) {
    console.error("Gagal menghapus komentar:", error);
    alert(`Gagal menghapus komentar: ${error.message}`);
    return;
  }

  if (!deletedComments || deletedComments.length === 0) {
    console.warn("Tidak ada komentar yang terhapus.");
    alert(
      "Komentar tidak terhapus. Kemungkinan user_id tidak cocok atau policy RLS bermasalah."
    );
    return;
  }

  // Hapus komentar dari tampilan
  setComments((current) => ({
    ...current,
    [postId]: (current[postId] || []).filter(
      (comment) => comment.id !== commentId
    ),
  }));

  // Kurangi jumlah komentar
  setPosts((currentPosts) =>
    currentPosts.map((post) =>
      post.id === postId
        ? {
            ...post,
            comments: Math.max((post.comments || 0) - 1, 0),
          }
        : post
    )
  );
};

const handleLike = async (postId) => {
  console.log("LIKE DEBUG:", {
    postId,
    userId: session?.user?.id,
    alreadyLiked: likes[postId],
  });

  if (!session?.user?.id) {
    return;
  }

  if (likeLoading[postId]) {
    return;
  }

  setLikeLoading((current) => ({
    ...current,
    [postId]: true,
  }));

  const alreadyLiked = likes[postId];

  if (alreadyLiked) {
    // Hapus like
    const { data: deletedLikes, error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", session.user.id)
      .select();

    console.log("DELETE LIKE RESULT:", {
      postId,
      userId: session.user.id,
      deletedLikes,
      error,
    });

    if (error) {
      console.error("Gagal menghapus like:", error);
      alert(`Gagal menghapus like: ${error.message}`);
    } else if (!deletedLikes || deletedLikes.length === 0) {
      console.warn("DELETE tidak menghapus baris apa pun.");
      alert("Like tidak ditemukan atau tidak bisa dihapus.");
    } else {
      setLikes((current) => {
        const updated = { ...current };
        delete updated[postId];
        return updated;
      });

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: Math.max((post.likes || 0) - 1, 0),
              }
            : post
        )
      );
    }


      // Hapus notifikasi like yang dibuat oleh pengguna ini
      const { data: deletedNotifications, error: notificationDeleteError } =
  await supabase
    .from("notifications")
    .delete()
    .eq("actor_id", session.user.id)
    .eq("post_id", postId)
    .eq("type", "like")
    .select("id");

console.log("HASIL HAPUS NOTIFIKASI:", {
  deletedNotifications,
  notificationDeleteError,
});

if (notificationDeleteError) {
  console.error(
    "Gagal menghapus notifikasi like:",
    notificationDeleteError
  );
}


  } else {
    // Tambah like
    const { error } = await supabase
      .from("post_likes")
      .insert({
        post_id: postId,
        user_id: session.user.id,
      });

    if (error) {
      console.error("Gagal memberi like:", error);
      alert(`Gagal memberi like: ${error.message}`);
    } else {
      // Perbarui status like
      setLikes((current) => ({
        ...current,
        [postId]: true,
      }));

      // Tambah jumlah like
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: (post.likes || 0) + 1,
              }
            : post
        )
      );

      // Buat notifikasi untuk pemilik postingan
      const post = posts.find((p) => p.id === postId);

      if (post && post.user_id !== session.user.id) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: post.user_id,
            actor_id: session.user.id,
            post_id: postId,
            type: "like",
            message: "menyukai postingan Anda",
          });

        if (notificationError) {
          console.error(
            "Gagal membuat notifikasi like:",
            notificationError
          );
        }
      }
    }
  }

  setLikeLoading((current) => ({
    ...current,
    [postId]: false,
  }));
};


const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Gagal logout:", error);
    alert(`Gagal logout: ${error.message}`);
  }
};

if (loading) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      Memuat Ruang Kita...
    </div>
  );
}

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">R</div>
          <div>
            <h1>Ruang Kita</h1>
            <span>Community Forum</span>
          </div>
        </div>

        <nav className="navigation">
  {["Beranda", "Eksplorasi", "Komunitas", "Topik", "Notifikasi", "Profil"].map(
    (menu) => (
      <button
        key={menu}
        className={
          activeMenu === menu
            ? "nav-item active"
            : "nav-item"
        }
        onClick={() => setActiveMenu(menu)}
      >
        <span className="nav-icon">
          {menu === "Beranda" && "⌂"}
          {menu === "Eksplorasi" && "⌕"}
          {menu === "Topik" && "#"}
          {menu === "Notifikasi" && "♡"}
          {menu === "Profil" && "●"}
          {menu === "Komunitas" && "👥"}
        </span>

        <span className="nav-item-label">
          {menu}
        </span>

        {menu === "Notifikasi" &&
  unreadNotificationCount > 0 && (
    <span className="notification-badge">
      {unreadNotificationCount > 99
        ? "99+"
        : unreadNotificationCount}
    </span>
  )}
      </button>
    )
  )}
</nav>

        <button
  className="create-button"
  onClick={() => {
    setShowPostForm(true);
    setPostSubmitError("");
  }}
>
  + Buat Postingan
</button>

<div className="sidebar-bottom">
  <div className="mini-profile">
    
  <div className="avatar">
    {profile?.avatar_url ? (
      <img
        src={profile.avatar_url}
        alt="Foto profil"
        className="profile-avatar-image"
      />
    ) : (
      (profile?.full_name || "Pengguna Ruang Kita")
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    )}
  </div>


    <div>
      <strong>
        {profile?.full_name || "Pengguna Ruang Kita"}
      </strong>
      <span>
        @{profile?.username || "user"}
      </span>
    </div>
  </div>

  <button
    className="logout-button"
    onClick={handleLogout}
  >
    🚪 Logout
  </button>
</div>

      </aside>

      {/* Main Content */}
      <main className="main-content">

        
{/* Halaman daftar komunitas */}
{activeMenu === "Komunitas" && (
  <section className="community-page">
    <div className="community-page-heading">
      <h2>Komunitas Ruang Kita</h2>
      <p>Temukan komunitas yang sesuai dengan minatmu.</p>
    </div>

    {communitiesLoading && <p>Memuat komunitas...</p>}

    {communitiesError && (
      <p className="community-error">{communitiesError}</p>
    )}

    {communityMessage && (
      <p className="community-message">{communityMessage}</p>
    )}

    {!communitiesLoading && !communitiesError && (
      <div className="community-grid">
        {communities.map((community) => (
          <article className="community-card" key={community.id}>
            <div className="community-card-icon">
              {community.icon}
            </div>

            <h3>{community.name}</h3>
            <p>{community.description}</p>

            <span className="community-count">
              {community.member_count} anggota
            </span>

            <div className="community-card-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleOpenCommunity(community)}
              >
                Lihat Detail
              </button>

              {community.is_member ? (
                <button
                  type="button"
                  className="community-leave-button"
                  disabled={communityActionLoading}
                  onClick={() => handleLeaveCommunity(community)}
                >
                  Keluar
                </button>
              ) : (
                <button
                  type="button"
                  className="community-join-button"
                  disabled={communityActionLoading}
                  onClick={() => handleJoinCommunity(community)}
                >
                  {communityActionLoading ? "Memproses..." : "Gabung"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    )}
  </section>
)}

{/* Halaman detail komunitas */}
{activeMenu === "Detail Komunitas" && selectedCommunity && (
  <section className="community-detail-page">
    <button
      type="button"
      className="secondary-button"
      onClick={() => setActiveMenu("Komunitas")}
    >
      ← Kembali ke Komunitas
    </button>

    <div className="community-detail-card">
      <div className="community-detail-icon">
        {selectedCommunity.icon}
      </div>

      <h2>{selectedCommunity.name}</h2>
      <p>{selectedCommunity.description}</p>

      <strong>
        {communities.find(
          (item) => item.id === selectedCommunity.id
        )?.member_count ?? selectedCommunity.member_count ?? 0} anggota
      </strong>

      {communities.find(
        (item) => item.id === selectedCommunity.id
      )?.is_member ? (
        <button
          type="button"
          className="community-leave-button"
          disabled={communityActionLoading}
          onClick={() => handleLeaveCommunity(selectedCommunity)}
        >
          Keluar dari Komunitas
        </button>
      ) : (
        <button
          type="button"
          className="community-join-button"
          disabled={communityActionLoading}
          onClick={() => handleJoinCommunity(selectedCommunity)}
        >
          {communityActionLoading ? "Memproses..." : "Gabung Komunitas"}
        </button>
      )}
    </div>

    {communityMessage && (
      <p className="community-message">{communityMessage}</p>
    )}

    <div className="community-members-section">
      <h3>Anggota Komunitas</h3>

      {communityMembersLoading ? (
        <p>Memuat anggota...</p>
      ) : communityMembers.length === 0 ? (
        <p>Belum ada anggota. Jadilah yang pertama bergabung!</p>
      ) : (
        <div className="community-member-list">
          {communityMembers.map((member) => (
            <div
              className="community-member-item"
              key={member.user_id}
            >
              <div className="community-member-avatar">
                {(member.profile?.full_name || "P")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {member.profile?.full_name || "Pengguna Ruang Kita"}
                </strong>
                <small>
                  {member.profile?.username
                    ? `@${member.profile.username}`
                    : "Anggota"}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
)}

        {showPostForm && (
  <div className="post-form-overlay">
    <div className="post-form-card">
      <div className="post-form-header">
        <div>
          <h2>Buat Postingan</h2>
          <p>Bagikan cerita, ide, atau pengetahuanmu.</p>
        </div>

        <button
          type="button"
          className="post-form-close"
          onClick={() => {
            setShowPostForm(false);
            setPostSubmitError("");
          }}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleCreatePost}>
        <div className="form-group">
          <label>Judul</label>

          <input
            type="text"
            placeholder="Masukkan judul diskusi..."
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            maxLength={150}
            required
          />
        </div>

        <div className="form-group">
          <label>Kategori</label>

          <select
            value={postCategory}
            onChange={(e) => setPostCategory(e.target.value)}
          >
            <option value="Diskusi">Diskusi</option>
            <option value="Teknologi">Teknologi</option>
            <option value="Kampus">Kampus</option>
            <option value="Pemrograman">Pemrograman</option>
            <option value="Karier">Karier</option>
          </select>
        </div>

        <div className="form-group">
          <label>Isi Diskusi</label>

          <textarea
            placeholder="Tulis isi diskusimu..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            rows={6}
            required
          />
        </div>

          
<div className="form-group">
  <label>Gambar (opsional)</label>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp,image/gif"
    onChange={(event) => {
      const file = event.target.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setPostSubmitError("Pilih file gambar yang valid.");
        event.target.value = "";
        return;
      }

      if (
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ].includes(file.type)
      ) {
        setPostSubmitError(
          "Format gambar harus JPG, PNG, WEBP, atau GIF."
        );
        event.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setPostSubmitError(
          "Ukuran gambar maksimal 5 MB."
        );
        event.target.value = "";
        return;
      }

      setPostSubmitError("");
      setPostImage(file);
      setPostImagePreview(URL.createObjectURL(file));
    }}
  />

  {postImagePreview && (
    <div className="image-preview-container">
      <img
        src={postImagePreview}
        alt="Preview gambar postingan"
        className="post-image-preview"
      />

      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          URL.revokeObjectURL(postImagePreview);
          setPostImage(null);
          setPostImagePreview("");
        }}
      >
        Hapus gambar
      </button>
    </div>
  )}
</div>

        {postSubmitError && (
          <div className="auth-message auth-error">
            {postSubmitError}
          </div>
        )}

        <div className="post-form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setShowPostForm(false);
              setPostSubmitError("");
            }}
          >
            Batal
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={postSubmitting}
          >
            {postSubmitting ? "Memposting..." : "Posting"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{showProfileForm && (
  <div className="post-form-overlay">
    <div className="post-form-card">
      
      <div className="post-form-header">
        <div>
          <h2>Edit Profil</h2>
          <p>Perbarui informasi profil kamu.</p>
        </div>

        <button
          type="button"
          className="post-form-close"
          onClick={() => {
            setShowProfileForm(false);
            setProfileError("");
          }}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleUpdateProfile}>

        <div className="form-group">
          <label>Nama Lengkap</label>

          <input
            type="text"
            value={profileName}
            onChange={(event) =>
              setProfileName(event.target.value)
            }
            placeholder="Masukkan nama lengkap"
            maxLength={100}
            required
          />
        </div>

        <div className="form-group">
          <label>Username</label>

          <input
            type="text"
            value={profileUsername}
            onChange={(event) =>
              setProfileUsername(event.target.value)
            }
            placeholder="Masukkan username"
            maxLength={30}
            required
          />

          <small>
            Username akan digunakan sebagai identitas kamu di Ruang Kita.
          </small>
        </div>

        <div className="form-group">
          <label>Bio</label>

          <textarea
            value={profileBio}
            onChange={(event) =>
              setProfileBio(event.target.value)
            }
            placeholder="Ceritakan sedikit tentang kamu..."
            rows={4}
            maxLength={200}
          />

          <small>
            Maksimal 200 karakter.
          </small>
        </div>

        
        
{/* Foto Profil */}
<div className="avatar-editor">
  <h3>Foto Profil</h3>

  {avatarPreview || profile?.avatar_url ? (
    <img
      src={avatarPreview || profile?.avatar_url}
      alt="Foto profil"
      className="avatar-editor-preview"
    />
  ) : (
    <div className="avatar-initials">
      {(
        profile?.full_name ||
        session?.user?.user_metadata?.full_name ||
        profile?.username ||
        session?.user?.email ||
        "U"
      )
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase()}
    </div>
  )}

  <label className="avatar-file-label">
    Pilih Foto
    <input
      id="avatar-file-input"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={handleAvatarChange}
    />
  </label>

  <p className="avatar-message">
    JPG, PNG, atau WEBP. Maksimal 2 MB.
  </p>

  {avatarMessage && (
    <p className="avatar-message" role="status">
      {avatarMessage}
    </p>
  )}

  <div className="avatar-editor-actions">
    <button
      type="button"
      onClick={handleSaveAvatar}
      disabled={!avatarFile || avatarLoading}
    >
      {avatarLoading ? "Menyimpan..." : "Simpan Foto Profil"}
    </button>

    {profile?.avatar_url && (
      <button
        type="button"
        className="avatar-delete-button"
        onClick={() => {
          handleDeleteAvatar?.();
        }}
        disabled={avatarLoading}
      >
        {avatarLoading ? "Memproses..." : "Hapus Foto"}
      </button>
    )}
  </div>
</div>



        {profileError && (
          <div className="auth-message auth-error">
            {profileError}
          </div>
        )}

        <div className="post-form-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setShowProfileForm(false);
              setProfileError("");
            }}
          >
            Batal
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={profileSaving}
          >
            {profileSaving
              ? "Menyimpan..."
              : "Simpan Profil"}
          </button>

        </div>

      </form>
    </div>
  </div>
)}

        <header className="topbar">
          <div>
            <h2>{activeMenu}</h2>
            <p>Tempat berbagi cerita, ide, dan pengetahuan.</p>
          </div>
        </header>

        {activeMenu === "Beranda" && (
  <>
    {/* Welcome */}
    <section className="welcome-card">
          <div>
            <span className="welcome-label">SELAMAT DATANG 👋</span>
            <h2>Temukan ruang untuk berdiskusi.</h2>
            <p>
              Bergabung dengan komunitas Ruang Kita dan bagikan pemikiranmu
              dengan orang lain.
            </p>
            <button className="primary-button">Mulai Berdiskusi</button>
          </div>

          <div className="welcome-decoration">
            <div className="bubble bubble-one">💡</div>
            <div className="bubble bubble-two">💬</div>
            <div className="bubble bubble-three">🚀</div>
          </div>
        </section>

        {/* Feed */}
        <section className="feed-section">
          <div className="section-header">
            <div>
              <h3>Diskusi Terbaru</h3>
              <p>Percakapan terbaru dari komunitas.</p>
            </div>

            <button className="filter-button">Terbaru ▾</button>
          </div>

          <div className="post-list">
  {postsLoading ? (
    <div className="empty-state">
      Memuat diskusi...
    </div>
  ) : postsError ? (
    <div className="empty-state">
      Gagal memuat diskusi: {postsError}
    </div>
  ) : posts.length === 0 ? (
    <div className="empty-state">
      Belum ada diskusi. Jadilah yang pertama membuat postingan!
    </div>
  ) : (
    posts.map((post) => (
  <article
    className={`post-card ${
      selectedPostId === post.id ? "post-selected" : ""
    }`}
    key={post.id}
    ref={(element) => {
      postRefs.current[post.id] = element;
    }}
  >
        <div className="post-header">
          <div className="post-user">
            <div className="avatar">
  {post.avatar_url ? (
    <img
      src={post.avatar_url}
      alt="Foto profil"
      className="profile-avatar-image"
    />
  ) : (
    post.user
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  )}
</div>

            <div>
              <strong>{post.user}</strong>

              <span>
                {post.username} ·{" "}
                {new Date(post.created_at).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>

          <div className="post-header-actions">
  <span className="category">
    {post.category}
  </span>

  {post.user_id === session?.user?.id && (
    <>
    <button
      type="button"
      className="edit-post-button"
      onClick={() => handleOpenEditPost(post)}
      title="Edit postingan"
    >
      ✏️ Edit
    </button>
    <button
      type="button"
      className="delete-post-button"
      onClick={() => handleDeletePost(post.id)}
      title="Hapus postingan"
    >
      🗑 Hapus
    </button>
    </>
  )}
</div>
        </div>

        {editingPostId === post.id ? (
  <form
    className="edit-post-form"
    onSubmit={(event) =>
      handleSaveEditPost(event, post.id)
    }
  >
    <label>Judul postingan</label>
    <input
      type="text"
      value={editPostTitle}
      onChange={(event) =>
        setEditPostTitle(event.target.value)
      }
      required
    />

    <label>Kategori</label>
    <select
      value={editPostCategory}
      onChange={(event) =>
        setEditPostCategory(event.target.value)
      }
    >
      <option value="Diskusi">Diskusi</option>
      <option value="Pertanyaan">Pertanyaan</option>
      <option value="Informasi">Informasi</option>
      <option value="Pengumuman">Pengumuman</option>
      <option value="Pengalaman">Pengalaman</option>
    </select>

    <label>Isi postingan</label>
    <textarea
      value={editPostContent}
      onChange={(event) =>
        setEditPostContent(event.target.value)
      }
      rows={5}
      required
    />
<div className="edit-post-image-section">
  <label>Gambar postingan</label>

  {editPostImagePreview ? (
    <img
      src={editPostImagePreview}
      alt="Pratinjau gambar baru"
      className="post-image-preview"
    />
  ) : post.image_url && !removePostImage ? (
    <img
      src={post.image_url}
      alt="Gambar postingan saat ini"
      className="post-image-preview"
    />
  ) : (
    <p>Belum ada gambar.</p>
  )}

  <div className="post-image-actions">
    <button
      type="button"
      disabled={editPostSaving}
      onClick={() =>
        document.getElementById(`edit-image-${post.id}`)?.click()
      }
    >
      ✏️ Pilih gambar baru
    </button>

    {(post.image_url || editPostImage) && !removePostImage && (
      <button
        type="button"
        disabled={editPostSaving}
        onClick={() => {
          setRemovePostImage(true);
          setEditPostImage(null);

          if (editPostImagePreview) {
            URL.revokeObjectURL(editPostImagePreview);
          }

          setEditPostImagePreview("");
        }}
      >
        🗑 Hapus gambar
      </button>
    )}

    {removePostImage && (
      <button
        type="button"
        disabled={editPostSaving}
        onClick={() => setRemovePostImage(false)}
      >
        ↩ Batalkan hapus
      </button>
    )}
  </div>

  <input
    id={`edit-image-${post.id}`}
    type="file"
    accept="image/*"
    hidden
    onChange={(event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setEditPostError("Pilih file gambar yang valid.");
        event.target.value = "";
        return;
      }

      if (editPostImagePreview) {
        URL.revokeObjectURL(editPostImagePreview);
      }

      setEditPostImage(file);
      setRemovePostImage(false);
      setEditPostImagePreview(URL.createObjectURL(file));
      setEditPostError("");
      event.target.value = "";
    }}
  />
</div>

    {editPostError && (
      <p className="edit-post-error">
        {editPostError}
      </p>
    )}

    <div className="edit-post-actions">
      <button
        type="submit"
        disabled={editPostSaving}
      >
        {editPostSaving
          ? "Menyimpan..."
          : "Simpan Perubahan"}
      </button>

      <button
        type="button"
        disabled={editPostSaving}
        onClick={() => {
          setEditingPostId(null);
          setEditPostError("");
        }}
      >
        Batal
      </button>
    </div>
  </form>
) : (
  <>
    <h3>{post.title}</h3>
    <p className="post-content">
      {post.content}
    </p>
  </>
)}

{/* Gambar postingan hanya tampil di luar mode edit */}
{editingPostId !== post.id && post.image_url && (
  <div className="post-image-container">
    <img
      src={post.image_url}
      alt={`Gambar untuk ${post.title}`}
      className="post-image"
      loading="lazy"
    />

  </div>
)}

        <div className="post-actions">
  <button
    onClick={() => handleLike(post.id)}
    disabled={likeLoading[post.id]}
    className={likes[post.id] ? "liked" : ""}
  >
    {likes[post.id] ? "♥" : "♡"} {post.likes}
  </button>

  <button onClick={() => toggleComments(post.id)}>
  💬 {post.comments || 0}
</button>

 <button
  type="button"
  onClick={() => handleSharePost(post.id)}
>
  ↗ Bagikan
</button>
</div>

          {openComments[post.id] && (
  <div className="comments-section">
    <h4>Komentar</h4>

    {commentLoading[post.id] && !comments[post.id] ? (
      <p className="comment-info">
  Belum ada komentar.
</p>
) : (
  comments[post.id]?.map((comment) => (
    <div className="comment-item" key={comment.id}>
      <div className="avatar comment-avatar">
        {(comment.user || "U").charAt(0).toUpperCase()}
      </div>

      <div className="comment-content">
        <strong>
          {comment.user || "Pengguna Ruang Kita"}
        </strong>

        <span className="comment-username">
          {comment.username || "@user"}
        </span>

        <p>{comment.content}</p>

        <small>
          {new Date(comment.created_at).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </small>
          <div className="comment-action-row">
  <button
    type="button"
    className="reply-comment-button"
    onClick={() =>
      setReplyingTo(
        replyingTo === comment.id ? null : comment.id
      )
    }
  >
    {replyingTo === comment.id ? "Batal" : "↩ Balas"}
  </button>

  {comment.user_id === session?.user?.id && (
    <button
      type="button"
      className="delete-comment-button"
      onClick={() =>
        handleDeleteComment(post.id, comment.id)
      }
    >
      Hapus
    </button>
  )}
</div>

{replyingTo === comment.id && (
  <div className="reply-form">
    <input
      type="text"
      placeholder={`Balas ${comment.user || "komentar ini"}...`}
      value={replyInputs[comment.id] || ""}
      onChange={(event) =>
        setReplyInputs((current) => ({
          ...current,
          [comment.id]: event.target.value,
        }))
      }
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          handleAddReply(post.id, comment.id);
        }
      }}
    />

    <button
      type="button"
      onClick={() => handleAddReply(post.id, comment.id)}
      disabled={
        commentLoading[post.id] ||
        !(replyInputs[comment.id] || "").trim()
      }
    >
      Balas
    </button>
  </div>
)}
      </div>
    </div>
  ))
)}

    <div className="comment-form">
      <input
        type="text"
        placeholder="Tulis komentar..."
        value={commentInputs[post.id] || ""}
        onChange={(e) =>
          setCommentInputs((current) => ({
            ...current,
            [post.id]: e.target.value,
          }))
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleAddComment(post.id);
          }
        }}
      />

      <button
        onClick={() => handleAddComment(post.id)}
        disabled={commentLoading[post.id]}
      >
        {commentLoading[post.id] ? "..." : "Kirim"}
      </button>
    </div>
  </div>
)}

      </article>
    ))
  )}
</div>
                </section>
      </>
)}

{activeMenu === "Eksplorasi" && (
  <section className="explore-page">
    <div className="explore-card">

      <div className="explore-header">
        <div>
          <h2>🔎 Eksplorasi</h2>
          <p>
            Temukan postingan dan pengguna di Ruang Kita.
          </p>
        </div>
      </div>

      <div className="explore-search">
        <span>⌕</span>

        <input
          type="text"
          value={exploreSearch}
          onChange={(event) =>
            setExploreSearch(event.target.value)
          }
          placeholder="Cari postingan, nama pengguna, atau username..."
        />

        {exploreSearch && (
          <button
            onClick={() => setExploreSearch("")}
            className="clear-search"
          >
            ×
          </button>
        )}
      </div>

        <div className="explore-sort">
  <label htmlFor="explore-sort-select">
    Urutkan:
  </label>

  <select
    id="explore-sort-select"
    value={exploreSort}
    onChange={(event) =>
      setExploreSort(event.target.value)
    }
  >
    <option value="terbaru">Terbaru</option>
    <option value="terpopuler">Terpopuler</option>
  </select>
</div>

      <div className="explore-result-info">
        {exploreSearch ? (
          <span>
            Menampilkan hasil untuk:
            <strong> "{exploreSearch}"</strong>
          </span>
        ) : (
          <span>
            Postingan terbaru dari komunitas Ruang Kita
          </span>
        )}

        <span>
          {exploredPosts.length} postingan
        </span>
      </div>

      {exploredPosts.length === 0 ? (
        <div className="explore-empty">
          <div className="explore-empty-icon">
            🔎
          </div>

          <h3>Postingan tidak ditemukan</h3>

          <p>
            Coba gunakan kata kunci yang berbeda.
          </p>
        </div>
      ) : (
        <div className="explore-post-list">
          {exploredPosts.map((post) => (
            <article
              key={post.id}
              className="post-card explore-post"
            >
              <div className="post-header">
                <div className="post-avatar">
  {post.avatar_url ? (
    <img
      src={post.avatar_url}
      alt="Foto profil"
      className="post-avatar-image"
    />
  ) : (
    post.user
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  )}
</div>

                <div>
                  <strong>{post.user}</strong>

                  <span>
                    {post.username}
                  </span>
                </div>
              </div>

              <p className="post-content">
                    {post.content}
              </p>

          {editingPostId !== post.id && post.image_url && (
          <img
            src={post.image_url}
            alt={`Gambar untuk ${post.title}`}
            className="post-image"
            loading="lazy"
          />
        )}
             
<div className="post-actions">
  <button
    onClick={() => handleLike(post.id)}
    disabled={likeLoading[post.id]}
    className={likes[post.id] ? "liked" : ""}
  >
    {likes[post.id] ? "♥" : "♡"} {post.likes || 0}
  </button>

  <button onClick={() => toggleComments(post.id)}>
    💬 {post.comments || 0}
  </button>

  <span className="post-date">
    {new Date(post.created_at).toLocaleDateString("id-ID")}
  </span>
</div>

{openComments[post.id] && (
  <div className="comments-section">
    <h4>Komentar</h4>

    {commentLoading[post.id] && !comments[post.id] ? (
      <p className="comment-info">Memuat komentar...</p>
    ) : (comments[post.id] || []).length === 0 ? (
      <p className="comment-info">
        Belum ada komentar. Jadilah yang pertama!
      </p>
    ) : (
      
(comments[post.id] || [])
  .filter((comment) => !comment.parent_comment_id)
  .map((comment) => (
    <div className="comment-item" key={comment.id}>
      <div className="avatar comment-avatar">
        {(comment.user || "U").charAt(0).toUpperCase()}
      </div>

      <div className="comment-content">
        <strong>{comment.user || "Pengguna Ruang Kita"}</strong>
        <span className="comment-username">
          {comment.username || "@user"}
        </span>
        <p>{comment.content}</p>

        <small>
          {new Date(comment.created_at).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </small>

        <div className="comment-action-row">
          <button
            type="button"
            className="reply-comment-button"
            onClick={() =>
              setReplyingTo(
                replyingTo === comment.id ? null : comment.id
              )
            }
          >
            {replyingTo === comment.id ? "Batal" : "↩ Balas"}
          </button>

          {comment.user_id === session?.user?.id && (
            <button
              type="button"
              className="delete-comment-button"
              onClick={() =>
                handleDeleteComment(post.id, comment.id)
              }
            >
              Hapus
            </button>
          )}
        </div>

        {replyingTo === comment.id && (
          <div className="reply-form">
            <input
              type="text"
              placeholder={`Balas ${comment.user || "komentar ini"}...`}
              value={replyInputs[comment.id] || ""}
              onChange={(event) =>
                setReplyInputs((current) => ({
                  ...current,
                  [comment.id]: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddReply(post.id, comment.id);
                }
              }}
            />

            <button
              type="button"
              onClick={() =>
                handleAddReply(post.id, comment.id)
              }
              disabled={
                commentLoading[post.id] ||
                !(replyInputs[comment.id] || "").trim()
              }
            >
              Balas
            </button>
          </div>
        )}

        {(comments[post.id] || [])
          .filter(
            (reply) => reply.parent_comment_id === comment.id
          )
          .map((reply) => (
            <div className="comment-reply-item" key={reply.id}>
              <div className="avatar comment-avatar">
                {(reply.user || "U").charAt(0).toUpperCase()}
              </div>

              <div className="comment-content">
                <strong>
                  {reply.user || "Pengguna Ruang Kita"}
                </strong>
                <span className="comment-username">
                  {reply.username || "@user"}
                </span>
                <p>{reply.content}</p>

                <small>
                  {new Date(reply.created_at).toLocaleString(
                    "id-ID",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )}
                </small>

                {reply.user_id === session?.user?.id && (
                  <button
                    type="button"
                    className="delete-comment-button"
                    onClick={() =>
                      handleDeleteComment(post.id, reply.id)
                    }
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  ))

    )}

    <div className="comment-form">
      <input
        type="text"
        placeholder="Tulis komentar..."
        value={commentInputs[post.id] || ""}
        onChange={(event) =>
          setCommentInputs((current) => ({
            ...current,
            [post.id]: event.target.value,
          }))
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleAddComment(post.id);
          }
        }}
      />

      <button
        onClick={() => handleAddComment(post.id)}
        disabled={commentLoading[post.id]}
      >
        {commentLoading[post.id] ? "Mengirim..." : "Kirim"}
      </button>
    </div>
  </div>
)}
            </article>
          ))}
        </div>
      )}

    </div>
  </section>
)}

{activeMenu === "Topik" && (
  <section className="topic-page">
    <div className="topic-card">

      <div className="topic-header">
        <div>
          <h2> #️⃣ Topik</h2>
          <p>
            Jelajahi percakapan berdasarkan topik.
          </p>
        </div>

        {selectedTopic && (
          <button
            className="topic-reset"
            onClick={() => setSelectedTopic(null)}
          >
            ← Semua Topik
          </button>
        )}
      </div>

      {!selectedTopic ? (
        <>
          {topicList.length === 0 ? (
            <div className="topic-empty">
              <div> #️⃣ </div>

              <h3>Belum ada topik</h3>

              <p>
                Gunakan hashtag seperti #Teknologi
                pada postingan Anda.
              </p>
            </div>
          ) : (
            <div className="topic-list">
              {topicList.map((topic) => (
                <button
                  key={topic.name}
                  className="topic-item"
                  onClick={() =>
                    setSelectedTopic(topic.name)
                  }
                >
                  <div className="topic-icon">
                    #
                  </div>

                  <div className="topic-info">
                    <strong>{topic.name}</strong>

                    <span>
                      {topic.count} postingan
                    </span>
                  </div>

                  <span className="topic-arrow">
                    →
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="topic-results">

          <div className="topic-selected-title">
            <span>Topik</span>

            <h3>{selectedTopic}</h3>

            <p>
              Postingan yang menggunakan topik ini.
            </p>
          </div>

          {posts
            .filter((post) =>
              extractTopics(post.content).includes(
                selectedTopic
              )
            )
            .map((post) => (
              <article
                key={post.id}
                className="post-card topic-post"
              >
                <div className="post-header">
                  <div className="post-avatar">
  {post.avatar_url ? (
    <img
      src={post.avatar_url}
      alt="Foto profil"
      className="post-avatar-image"
    />
  ) : (
    post.user
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  )}
</div>

                  <div>
                    <strong>{post.user}</strong>
                    <span>{post.username}</span>
                  </div>
                </div>

                <div className="post-content">
                      {post.content}
                </div>

                <div className="post-meta">
                  <span>
                    ❤️ {post.likes || 0}
                  </span>

                  <span>
                    💬 {post.comments || 0}
                  </span>

                  <span>
                    {new Date(
                      post.created_at
                    ).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </article>
            ))}
        </div>
      )}

    </div>
  </section>
)}

{activeMenu === "Notifikasi" && (
  <section className="notification-page">
    <div className="notification-card">
      <div className="notification-header">
  <div>
    <h2>🔔 Notifikasi</h2>

    <p>
      {unreadNotificationCount > 0
        ? `Anda memiliki ${unreadNotificationCount} notifikasi yang belum dibaca.`
        : "Semua notifikasi sudah dibaca."}
    </p>
  </div>

  {unreadNotificationCount > 0 && (
    <button
      className="mark-all-read-button"
      onClick={markNotificationsAsRead}
    >
      ✓ Tandai semua sudah dibaca
    </button>
  )}
</div>

      {notificationLoading ? (
        <div className="notification-empty">
          Memuat notifikasi...
        </div>
      ) : notifications.length === 0 ? (
        <div className="notification-empty">
          <div className="notification-empty-icon">🔔</div>
          <h3>Belum ada notifikasi</h3>
          <p>
            Notifikasi like dan komentar akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <div
  key={notification.id}
  className={`notification-item ${
    notification.is_read ? "" : "unread"
  }`}
  onClick={() => handleNotificationClick(notification)}
>
              <div className="notification-icon">
                {notification.type === "like" ? "❤️" : "💬"}
              </div>

              <div className="notification-content">
                <p>
                  <strong>
                    {notification.actor?.full_name ||
                      notification.actor?.username ||
                      "Pengguna"}
                  </strong>{" "}
                  {notification.message}
                </p>

                <span>
                  {new Date(
                    notification.created_at
                  ).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
)}

{/* Profil */}
{activeMenu === "Profil" && (
  <section className="profile-page">
    <div className="profile-card">

      
      <div className="profile-avatar-large">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Foto profil"
            className="profile-avatar-image"
          />
        ) : (
          profile?.full_name?.charAt(0)?.toUpperCase() || "P"
        )}
      </div>

      <h2>
        {profile?.full_name || "Pengguna Ruang Kita"}
      </h2>

      <p className="profile-username">
        @{profile?.username || "user"}
      </p>

      <p className="profile-bio">
        {profile?.bio || "Belum ada bio."}
      </p>

      <button
        className="create-button"
        onClick={handleOpenProfileForm}
      >
        ✏️ Edit Profil
      </button>

    </div>
  </section>
)}
      </main>

      {/* Right Sidebar */}
      <aside className="right-sidebar">
        
<div className="search-box">
  <span>⌕</span>
  <input
    type="text"
    value={exploreSearch}
    onChange={(event) => {
      setExploreSearch(event.target.value);
      if (activeMenu !== "Eksplorasi") {
        setActiveMenu("Eksplorasi");
      }
    }}
    onKeyDown={(event) => {
      if (event.key === "Enter") {
        setActiveMenu("Eksplorasi");
      }
    }}
    placeholder="Cari diskusi..."
    aria-label="Cari diskusi"
  />
  {exploreSearch && (
    <button
      type="button"
      className="clear-search"
      aria-label="Hapus pencarian"
      onClick={() => setExploreSearch("")}
    >
      ×
    </button>
  )}
</div>

        <section className="side-card">
          <div className="side-title">
            <h3>Topik Populer</h3>
            <span>•••</span>
          </div>

        
<button
  type="button"
  className="topic"
  onClick={() => {
    setExploreSearch("Pemrograman");
    setActiveMenu("Eksplorasi");
  }}
>
  <span>#Pemrograman</span>
  <small>Jelajahi diskusi pemrograman</small>
</button>

<button
  type="button"
  className="topic"
  onClick={() => {
    setExploreSearch("Teknologi");
    setActiveMenu("Eksplorasi");
  }}
>
  <span>#Teknologi</span>
  <small>Jelajahi diskusi teknologi</small>
</button>

<button
  type="button"
  className="topic"
  onClick={() => {
    setExploreSearch("Mahasiswa");
    setActiveMenu("Eksplorasi");
  }}
>
  <span>#Mahasiswa</span>
  <small>Jelajahi diskusi mahasiswa</small>
</button>

<button
  type="button"
  className="topic"
  onClick={() => {
    setExploreSearch("Karier");
    setActiveMenu("Eksplorasi");
  }}
>
  <span>#Karier</span>
  <small>Jelajahi diskusi karier</small>
</button>

        </section>

        
<section className="side-card">
  <div className="side-title">
    <h3>Komunitas Aktif</h3>
  </div>

  {communitiesLoading ? (
    <p>Memuat komunitas...</p>
  ) : communitiesError ? (
    <p className="community-error">
      Gagal memuat komunitas: {communitiesError}
    </p>
  ) : (
    communities.slice(0, 3).map((community) => (
      <button
        type="button"
        className="community"
        key={community.id}
        onClick={() => handleOpenCommunity(community)}
      >
        <div className="community-icon">
          {community.icon}
        </div>

        <div className="community-info">
          <strong>{community.name}</strong>
          <small>{community.member_count} anggota</small>
        </div>

        <span className="community-arrow">›</span>
      </button>
    ))
  )}

  <button
    type="button"
    className="view-all-communities"
    onClick={() => setActiveMenu("Komunitas")}
  >
    Lihat semua komunitas →
  </button>
</section>

      </aside>
    </div>
  );
}
export default App;