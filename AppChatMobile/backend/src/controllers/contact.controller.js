const Contact = require('../models/contact.model');
const User = require('../models/user.model');

exports.syncContacts = async (req, res) => {
  const userId = req.user._id;
  const { contacts } = req.body; 

  try {
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ message: 'Danh sách liên hệ không hợp lệ' });
    }

    const validContacts = contacts
      .map((c) => ({
        userId,
        phone: c.phone.replace(/[^0-9+]/g, '').trim(),
        name: c.name || 'Không có tên',
      }))
      .filter((c) => c.phone.startsWith('+84') && c.phone.length === 12);

    if (validContacts.length === 0) {
      return res.status(400).json({ message: 'Không có số điện thoại hợp lệ' });
    }

  
    const operations = validContacts.map((contact) => ({
      updateOne: {
        filter: { userId, phone: contact.phone },
        update: {
          $set: {
            name: contact.name,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            userId: contact.userId,
            phone: contact.phone,
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await Contact.bulkWrite(operations);

    res.status(200).json({ message: 'Đã đồng bộ danh bạ thành công' });
  } catch (error) {
    console.error('Lỗi đồng bộ danh bạ:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Lỗi trùng lặp số điện thoại' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.getContacts = async (req, res) => {
  const userId = req.user._id;

  try {
    const contacts = await Contact.find({ userId }).select('phone name');
    res.status(200).json({ contacts });
  } catch (error) {
    console.error('Lỗi lấy danh bạ:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};