import { create } from 'zustand';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';

const useContactStore = create((set, get) => ({
  contacts: [],
  isLoading: false,
  error: null,

  // Lấy danh sách contacts
  fetchContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('🔍 Calling API:', axiosInstance.defaults.baseURL + 'contacts/');
      const response = await axiosInstance.get('contacts/'); // Sẽ thành http://localhost:3000/api/contacts/
      console.log('✅ Response:', response.data);
      set({ contacts: response.data.contacts, isLoading: false });
    } catch (error) {
      console.error('❌ Error:', error.response);
      const errorMessage = error.response?.data?.message || 'Lỗi khi tải danh bạ';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  // Tìm kiếm contacts
  searchContacts: (searchTerm) => {
    const { contacts } = get();
    if (!searchTerm) return contacts;
    
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm)
    );
  },

  // Clear store
  clearContacts: () => set({ contacts: [], error: null })
}));

export default useContactStore;
