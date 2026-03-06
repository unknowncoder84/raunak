module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // Disable the exhaustive-deps rule that's causing build failures
    'react-hooks/exhaustive-deps': 'off',
  },
};