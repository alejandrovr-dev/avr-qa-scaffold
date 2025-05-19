export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Example of customized rule: Increase max-length for subject line
    'subject-max-length': [2, 'always', 100], // Default is 72
    
    // Uncomment to enforce body in commit messages
    // 'body-empty': [2, 'never']
  }
};