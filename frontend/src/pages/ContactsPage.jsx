import React, { useEffect, useState } from 'react';
import { Search, Users, Phone, RefreshCw } from 'lucide-react';
import useContactStore from '../store/useContactStore';
import toast from 'react-hot-toast';

const ContactsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const { contacts, isLoading, error, fetchContacts } = useContactStore();

  useEffect(() => {
    console.log('🚀 ContactsPage mounted, calling fetchContacts');
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    console.log('📋 Contacts updated:', contacts);
  }, [contacts]);

  // Lọc và sắp xếp contacts
  const filteredContacts = contacts
    .filter(contact => 
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name?.localeCompare(b.name) || 0;
      }
      return a.phone?.localeCompare(b.phone) || 0;
    });

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    if (phone.startsWith('+84')) {
      return phone.replace('+84', '0');
    }
    return phone;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Đang tải danh bạ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-medium mb-2">Có lỗi xảy ra</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchContacts()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Danh bạ</h1>
          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm font-medium">
            {contacts.length} liên hệ
          </span>
        </div>
        
        <button
          onClick={() => fetchContacts()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="name">Sắp xếp theo tên</option>
          <option value="phone">Sắp xếp theo số điện thoại</option>
        </select>
      </div>

      {/* Danh sách contacts */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            {searchTerm ? 'Không tìm thấy liên hệ nào' : 'Chưa có liên hệ nào'}
          </h3>
          <p className="text-gray-400">
            {searchTerm 
              ? 'Thử tìm kiếm với từ khóa khác' 
              : 'Danh bạ hiện tại trống'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredContacts.map((contact) => (
            <div
              key={contact._id}
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {contact.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800">
                    {contact.name || 'Không có tên'}
                  </h3>
                  <p className="text-gray-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {formatPhoneNumber(contact.phone)}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => window.open(`tel:${contact.phone}`)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactsPage;
