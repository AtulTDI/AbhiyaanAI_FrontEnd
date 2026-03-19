const Share = {
  open: async () => ({ success: false }),
  shareSingle: async () => ({ success: false }),
  isPackageInstalled: async () => ({ isInstalled: false }),

  Social: {
    FACEBOOK: 'facebook',
    FACEBOOK_STORIES: 'facebook-stories',
    PAGESMANAGER: 'pagesmanager',
    TWITTER: 'twitter',
    WHATSAPP: 'whatsapp',
    INSTAGRAM: 'instagram',
    INSTAGRAM_STORIES: 'instagram-stories',
    GOOGLEPLUS: 'googleplus',
    EMAIL: 'email',
    PINTEREST: 'pinterest',
    LINKEDIN: 'linkedin',
    SMS: 'sms',
    SNAPCHAT: 'snapchat',
    MESSENGER: 'messenger',
    TELEGRAM: 'telegram'
  }
};

export default Share;
