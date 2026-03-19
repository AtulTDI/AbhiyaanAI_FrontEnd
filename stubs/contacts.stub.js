export const Contact = {};

const Contacts = {
  getAll: async () => [],
  getAllWithoutPhotos: async () => [],
  getContactById: async () => null,
  getContactByPhoneNumber: async () => null,
  getContactByEmailAddress: async () => null,
  getContactsMatchingString: async () => [],
  addContact: async () => {},
  openContactForm: async () => null,
  openExistingContact: async () => null,
  editExistingContact: async () => null,
  updateContact: async () => {},
  deleteContact: async () => {},
  getGroups: async () => [],
  checkPermission: async () => 'denied',
  requestPermission: async () => 'denied',
  writePhotoToPath: async () => {}
};

export default Contacts;
