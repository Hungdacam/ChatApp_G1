import React, { useEffect, useState } from 'react';
import { Search, Users, MoreHorizontal, ChevronDown } from 'lucide-react';
import { useFriendStore } from '../store/useFriendStore';
import { useNavigate } from 'react-router-dom';

const FriendListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Tên (A-Z)');
  const [filterBy, setFilterBy] = useState('Tất cả');
  const { friends, fetchFriends, isLoading } = useFriendStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Lọc và sắp xếp bạn bè
  const filteredAndSortedFriends = friends
    .filter(friend =>
      friend.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name?.localeCompare(b.name));

  // Nhóm bạn bè theo chữ cái đầu
  const groupedFriends = filteredAndSortedFriends.reduce((groups, friend) => {
    const firstLetter = friend.name?.charAt(0).toUpperCase() || '#';
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(friend);
    return groups;
  }, {});

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Users size={20} className="text-gray-600" />
            <h1 className="text-lg font-medium">Danh sách bạn bè</h1>
          </div>
          
          {/* Search Bar */}
           <div className="relative">
        <Search size={16} className="absolute left-3 top-[55%] transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-md">
                <Users size={16} />
                <span>Danh sách bạn bè</span>
              </div>
             <button
  onClick={() => navigate('/contacts')}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
>
  <Users className="w-4 h-4" />
  Xem danh bạ
</button>
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer">
                <Users size={16} />
                <span>Lời mời kết bạn</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer">
                <Users size={16} />
                <span>Lời mời vào nhóm và cộng đồng</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-medium">Danh sách bạn bè</h2>
              <span className="text-sm text-gray-500">Bạn bè ({friends.length})</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm bạn"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                  <span>{sortBy}</span>
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                  <span>{filterBy}</span>
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAndSortedFriends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Users size={48} className="mb-2 opacity-50" />
              <p>Không tìm thấy bạn bè nào</p>
            </div>
          ) : (
            Object.keys(groupedFriends)
              .sort()
              .map((letter) => (
                <div key={letter}>
                  {/* Letter Header */}
                  <div className="sticky top-0 bg-gray-100 px-6 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700">{letter}</h3>
                  </div>

                  {/* Friends in this letter group */}
                  {groupedFriends[letter].map((friend) => (
                    <div
                      key={friend._id}
                      className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative">
                          <img
                            src={friend.avatar || '/default-avatar.png'}
                            alt={friend.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {friend.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>

                        {/* Friend Info */}
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">
                            {friend.name}
                          </h4>
                          {friend.businessTag && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded mt-1">
                              {friend.businessTag}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* More Options */}
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendListPage;
