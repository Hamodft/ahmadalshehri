/*
 * Admin authentication configuration.
 *
 * Email/password login is activated only after a Supabase project is linked.
 * The publishable key is safe to expose in a browser; never place a service
 * role key, GitHub token, or password in this file.
 */
window.ADMIN_AUTH_CONFIG = {
  enabled: false,
  supabaseUrl: '',
  supabasePublishableKey: '',
  ownerEmail: 'Ahmadfalshehry@gmail.com'
};
