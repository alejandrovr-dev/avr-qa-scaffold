#!/bin/bash
# tools/scripts/quality/setup-code-quality.sh
# Script to install and configure a complete code quality system:
#  ESLint, Prettier, Git, Commitizen, commitlint, lint-staged,
#  Husky, Jest and Benchmark configurations
# Author: Alejandro Valencia
# Date: Created in May 2025

# Colors for messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Code quality system configuration for Reelaisy API ===${NC}"

# Define minimum versions required
declare -A min_versions=(
  ["eslint"]="8.0.0"
  ["prettier"]="2.8.0"
  ["husky"]="8.0.0"
  ["lint-staged"]="13.0.0"
  ["eslint-config-airbnb-base"]="15.0.0"
  ["eslint-plugin-import"]="2.25.0"
  ["eslint-config-prettier"]="8.5.0"
  ["commitizen"]="4.3.0"
  ["cz-conventional-changelog"]="3.3.0"
  ["jest"]="29.0.0"
  ["benchmark"]="2.1.4"
)

# Define known compatibility issues
declare -A compatibility_issues=(
  ["eslint@8.x+eslint-config-prettier@<8.0.0"]="ESLint 8+ works best with eslint-config-prettier 8+"
  ["prettier@3.x+eslint-plugin-prettier@<5.0.0"]="Prettier 3+ requires eslint-plugin-prettier 5+"
  ["husky@8.x+lint-staged@<10.0.0"]="Husky 8+ works best with lint-staged 10+"
)

# Function to handle errors
handle_error() {
  local exit_code=$1
  local error_message=$2
  local command=$3
  
  if [ $exit_code -ne 0 ]; then
    echo -e "${RED}ERROR: $error_message${NC}"
    echo -e "${RED}Command that failed: $command${NC}"
    echo -e "${YELLOW}Troubleshooting suggestions:${NC}"
    
    case "$command" in
      *"npm install"*)
        echo -e "  - Check your internet connection"
        echo -e "  - Try cleaning the npm cache: npm cache clean --force"
        echo -e "  - Check permissions for the node_modules folder"
        ;;
      *"husky"*)
        echo -e "  - Make sure Git is installed and configured"
        echo -e "  - Verify that a Git repository is initialized (.git directory)"
        echo -e "  - Check permissions for the .husky folder"
        ;;
      *"commitlint"*)
        echo -e "  - Verify that @commitlint/cli and @commitlint/config-conventional are installed"
        echo -e "  - Make sure the commitlint.config.js file is valid"
        ;;
      *"commitizen"*)
        echo -e "  - Verify that commitizen and cz-conventional-changelog are installed"
        echo -e "  - Check the package.json for correct commitizen configuration"
        ;;
      *"jest"*)
        echo -e "  - Verify that jest is installed"
        echo -e "  - Check the jest.config.js file for correct configuration"
        ;;
      *"pkg set"*)
        echo -e "  - Verify that package.json exists and is valid"
        echo -e "  - Check if you have write permissions for package.json"
        echo -e "  - Make sure npm is up to date: npm install -g npm@latest"
        ;;
      *)
        echo -e "  - Try running the command manually to see more details"
        echo -e "  - Check file and folder permissions"
        ;;
    esac
    
    echo -e "${YELLOW}Do you want to continue with the script despite the error? (y/n)${NC}"
    read -r choice
    if [[ ! $choice =~ ^[Yy]$ ]]; then
      echo -e "${RED}Installation aborted.${NC}"
      exit $exit_code
    fi
    echo -e "${YELLOW}Continuing despite error...${NC}"
  fi
}

# Function to check version compatibility
check_version_compatibility() {
  # Check if semver is available via npx
  if ! command -v npx &> /dev/null; then
    echo -e "${YELLOW}⚠ npx is not available, skipping version compatibility checks${NC}"
    return 0
  fi
  
  # Install semver if needed (for version comparison)
  if ! npx --no-install semver &>/dev/null; then
    echo -e "${YELLOW}Installing semver for version checking...${NC}"
    npm install --no-save semver &>/dev/null
  fi
  
  # Check individual package versions
  echo -e "${YELLOW}Checking package version compatibility...${NC}"
  for package in "${!min_versions[@]}"; do
    min_version=${min_versions[$package]}
    
    # Check if package is installed
    if npm list --depth=0 "$package" &>/dev/null; then
      installed_version=$(npm list --depth=0 "$package" | grep "$package" | sed 's/.*@//')
      
      # Remove leading/trailing spaces
      installed_version=$(echo "$installed_version" | xargs)
      
      # Compare versions
      if ! npx --no semver "$installed_version" --range ">=$min_version" &>/dev/null; then
        echo -e "${YELLOW}⚠ Package $package is at version $installed_version but >=$min_version is recommended${NC}"
        echo -e "  Do you want to update this package? (y/n)"
        read -r choice
        if [[ $choice =~ ^[Yy]$ ]]; then
          echo -e "  Updating $package to latest version..."
          npm install --save-dev "$package@latest"
          handle_error $? "Failed to update $package" "npm install --save-dev $package@latest"
        fi
      else
        echo -e "  ✓ $package version $installed_version is compatible (>= $min_version)"
      fi
    fi
  done
  
  # Check for known compatibility issues between packages
  echo -e "${YELLOW}Checking for known compatibility issues...${NC}"
  for issue_key in "${!compatibility_issues[@]}"; do
    # Parse the issue key (format: "packageA@versionX+packageB@versionY")
    package1=$(echo "$issue_key" | cut -d'+' -f1 | cut -d'@' -f1)
    version1=$(echo "$issue_key" | cut -d'+' -f1 | cut -d'@' -f2)
    package2=$(echo "$issue_key" | cut -d'+' -f2 | cut -d'@' -f1)
    version2=$(echo "$issue_key" | cut -d'+' -f2 | cut -d'@' -f2)
    
    # Check if both packages are installed
    if npm list --depth=0 "$package1" &>/dev/null && npm list --depth=0 "$package2" &>/dev/null; then
      ver1=$(npm list --depth=0 "$package1" | grep "$package1" | sed 's/.*@//' | xargs)
      ver2=$(npm list --depth=0 "$package2" | grep "$package2" | sed 's/.*@//' | xargs)
      
      # Check if the versions match the compatibility issue
      if [[ "$version1" == *"x"* ]]; then
        major1=$(echo "$version1" | cut -d'.' -f1 | sed 's/x//')
        ver1_major=$(echo "$ver1" | cut -d'.' -f1)
        
        version1_match=false
        if [[ "$version1" == *"+"* ]]; then
          # For version format like "8.x+"
          if [ "$ver1_major" -ge "$major1" ]; then
            version1_match=true
          fi
        else
          # For version format like "8.x"
          if [ "$ver1_major" -eq "$major1" ]; then
            version1_match=true
          fi
        fi
      else
        # For specific version ranges like "<8.0.0"
        version1_match=false
        if [[ "$version1" == "<"* ]]; then
          version_limit=${version1:1}
          if npx --no semver "$ver1" --range "<$version_limit" &>/dev/null; then
            version1_match=true
          fi
        elif [[ "$version1" == ">"* ]]; then
          version_limit=${version1:1}
          if npx --no semver "$ver1" --range ">$version_limit" &>/dev/null; then
            version1_match=true
          fi
        fi
      fi
      
      # Repeat for second package
      if [[ "$version2" == *"x"* ]]; then
        major2=$(echo "$version2" | cut -d'.' -f1 | sed 's/x//')
        ver2_major=$(echo "$ver2" | cut -d'.' -f1)
        
        version2_match=false
        if [[ "$version2" == *"+"* ]]; then
          # For version format like "8.x+"
          if [ "$ver2_major" -ge "$major2" ]; then
            version2_match=true
          fi
        else
          # For version format like "8.x"
          if [ "$ver2_major" -eq "$major2" ]; then
            version2_match=true
          fi
        fi
      else
        # For specific version ranges like "<8.0.0"
        version2_match=false
        if [[ "$version2" == "<"* ]]; then
          version_limit=${version2:1}
          if npx --no semver "$ver2" --range "<$version_limit" &>/dev/null; then
            version2_match=true
          fi
        elif [[ "$version2" == ">"* ]]; then
          version_limit=${version2:1}
          if npx --no semver "$ver2" --range ">$version_limit" &>/dev/null; then
            version2_match=true
          fi
        fi
      fi
      
      # If both version conditions match, we have a compatibility issue
      if [ "$version1_match" = true ] && [ "$version2_match" = true ]; then
        echo -e "${YELLOW}⚠ Compatibility issue detected: ${compatibility_issues[$issue_key]}${NC}"
        echo -e "  $package1@$ver1 and $package2@$ver2 may have compatibility issues."
        echo -e "  Do you want to update $package2? (y/n)"
        read -r choice
        if [[ $choice =~ ^[Yy]$ ]]; then
          echo -e "  Updating $package2 to latest version..."
          npm install --save-dev "$package2@latest"
          handle_error $? "Failed to update $package2" "npm install --save-dev $package2@latest"
        fi
      fi
    fi
  done
}

# Function to check if a package is already installed
is_package_installed() {
  if grep -q "\"$1\":" package.json; then
    return 0 # True, it's installed
  else
    return 1 # False, it's not installed
  fi
}

# Install dependencies
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"

packages=(
  "eslint"
  "eslint-config-airbnb-base"
  "eslint-plugin-import"
  "eslint-plugin-jest"
  "eslint-plugin-security"
  "eslint-plugin-promise"
  "eslint-config-prettier"
  "eslint-plugin-prettier"
  "prettier"
  "husky"
  "lint-staged"
  "@commitlint/cli"
  "@commitlint/config-conventional"
  "commitizen"
  "cz-conventional-changelog"
  "jest"
  "benchmark"
)

# Check and display which packages will be installed
to_install=()
for package in "${packages[@]}"; do
  if ! is_package_installed "$package"; then
    to_install+=("$package")
  else
    echo -e "  - $package ${GREEN}(already installed)${NC}"
  fi
done

# Install missing packages
if [ ${#to_install[@]} -gt 0 ]; then
  echo -e "  Installing packages: ${to_install[*]}"
  npm install --save-dev "${to_install[@]}"
  handle_error $? "Failed to install dependencies" "npm install --save-dev ${to_install[*]}"
else
  echo -e "  ${GREEN}All dependencies are already installed.${NC}"
fi

# Run version compatibility check
check_version_compatibility

# Create configuration files
echo -e "${YELLOW}Step 2: Creating configuration files...${NC}"

# Create Jest configuration file if it doesn't exist
if [ ! -f jest.config.js ]; then
  echo -e "  Creating jest.config.js..."
  cat > jest.config.js << 'EOL'
export default {
  // Configuration for Node.js 20+ and ESModules
  testEnvironment: 'node',

  // Test file patterns
  testMatch: ['**/tests/**/*.js', '**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],

  // Import transformation
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Code coverage
  collectCoverage: false,
  coverageDirectory: '.coverage',
  coverageReporters: ['lcov', 'html', 'text'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!**/*.bench.js',
    '!**/temp/**',
    '!**/.husky/**',
    '!**/node_modules/**',
    '!**/.vscode/**',
    '!**/.VSCodeCounter/**',
  ],

  // Paths to ignore
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tools/temp/', '\\.bench\\.js$'],
};
EOL
  handle_error $? "Failed to create jest.config.js" "cat > jest.config.js"
  echo -e "  ${GREEN}✓ jest.config.js file created${NC}"
else
  echo -e "  ${GREEN}✓ jest.config.js file already exists${NC}"
fi

# Create commitlint.config.js if it doesn't exist
if [ ! -f commitlint.config.js ]; then
  echo -e "  Creating commitlint.config.js..."
  cat > commitlint.config.js << 'EOL'
export default {
  extends: ['@commitlint/config-conventional']
};
EOL
  handle_error $? "Failed to create commitlint.config.js" "cat > commitlint.config.js"
  echo -e "  ${GREEN}✓ commitlint.config.js file created${NC}"
else
  echo -e "  ${GREEN}✓ commitlint.config.js file already exists${NC}"
fi

# Create .eslintrc.json if it doesn't exist
if [ ! -f .eslintrc.json ]; then
  echo -e "  Creating .eslintrc.json..."
  cat > .eslintrc.json << 'EOL'
{
  "env": {
    "node": true,
    "es2021": true,
    "jest": true
  },
  "extends": [
    "airbnb-base",
    "plugin:jest/recommended",
    //issue: plugin:security/recommended is invalid: Unexpected top-level property "name"
    //"plugin:security/recommended",
    "plugin:prettier/recommended"
  ],
  "plugins": ["import", "jest", /*"security",*/ "promise", "prettier"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    // General rules
    "no-console": ["warn", { "allow": ["warn", "error", "info"] }],
    "no-underscore-dangle": "off",
    "no-param-reassign": [
      "error",
      {
        "props": true,
        "ignorePropertyModificationsFor": ["req", "res", "ctx", "acc"]
      }
    ],

    // Specific rules for ESM import
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "js": "always"
      }
    ],
    "import/prefer-default-export": "off",
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
        "alphabetize": { "order": "asc", "caseInsensitive": true }
      }
    ],

    // Specific rules for Express APIs
    "consistent-return": "off",
    "no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],

    // Security rules
    //"security/detect-object-injection": "off",

    // Promises rules
    "promise/always-return": "error",
    "promise/no-return-wrap": "error",
    "promise/param-names": "error",
    "promise/catch-or-return": "error",
    "promise/no-native": "off",
    "promise/no-promise-in-callback": "warn",
    "promise/no-callback-in-promise": "warn",

    // Prettier integration
    "prettier/prettier": "error"
  },
  "overrides": [
    {
      "files": ["**/*.test.js", "**/*.spec.js"],
      "rules": {
        "import/no-extraneous-dependencies": ["error", { "devDependencies": true }]
      }
    },
    {
      "files": ["scripts/**/*.js"],
      "rules": {
        "import/no-extraneous-dependencies": ["error", { "devDependencies": true }],
        "no-console": "off"
      }
    },
    {
      "files": ["**/config/**/*.js", "**/*.config.js"],
      "rules": {
        "import/no-extraneous-dependencies": ["error", { "devDependencies": true }]
      }
    }
  ],
  "settings": {
    "import/resolver": {
      "node": {
        "extensions": [".js", ".json"]
      }
    },
    "import/extensions": [".js"],
    "import/core-modules": []
  }
}
EOL
  handle_error $? "Failed to create .eslintrc.json" "cat > .eslintrc.json"
  echo -e "  ${GREEN}✓ .eslintrc.json file created${NC}"
else
  echo -e "  ${GREEN}✓ .eslintrc.json file already exists${NC}"
fi

# Create .prettierrc if it doesn't exist
if [ ! -f .prettierrc.json ]; then
  echo -e "  Creating .prettierrc.json..."
  cat > .prettierrc.json << 'EOL'
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "trailingComma": "all",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "embeddedLanguageFormatting": "auto"
}
EOL
  handle_error $? "Failed to create .prettierrc.json" "cat > .prettierrc.json"
  echo -e "  ${GREEN}✓ .prettierrc.json file created${NC}"
else
  echo -e "  ${GREEN}✓ .prettierrc.json file already exists${NC}"
fi

# Create .lintstagedrc.json if it doesn't exist
if [ ! -f .lintstagedrc.json ]; then
  echo -e "  Creating .lintstagedrc.json..."
  cat > .lintstagedrc.json << 'EOL'
{
  "*.js": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
EOL
  handle_error $? "Failed to create .lintstagedrc.json" "cat > .lintstagedrc.json"
  echo -e "  ${GREEN}✓ .lintstagedrc.json file created${NC}"
else
  echo -e "  ${GREEN}✓ .lintstagedrc.json file already exists${NC}"
fi

# Add scripts to package.json
echo -e "${YELLOW}Step 3: Updating package.json...${NC}"

echo -e "  Adding scripts to package.json..."
npm pkg set "scripts.lint=eslint --ignore-path .gitignore --ext .js ."
handle_error $? "Failed to add lint script to package.json" "npm pkg set \"scripts.lint=eslint --ignore-path .gitignore --ext .js .\""

npm pkg set "scripts.lint:fix=eslint --ignore-path .gitignore --ext .js . --fix"
handle_error $? "Failed to add lint:fix script to package.json" "npm pkg set \"scripts.lint:fix=eslint --ignore-path .gitignore --ext .js . --fix\""

npm pkg set "scripts.format=prettier --ignore-path .gitignore --write \"**/*.{js,json,md}\""
handle_error $? "Failed to add format script to package.json" "npm pkg set \"scripts.format=prettier --ignore-path .gitignore --write \\\"**/*.{js,json,md}\\\"\""

npm pkg set "scripts.prepare=husky"
handle_error $? "Failed to add prepare script to package.json" "npm pkg set \"scripts.prepare=husky\""

# Add commit script for Commitizen
npm pkg set "scripts.commit=cz"
handle_error $? "Failed to add commit script to package.json" "npm pkg set \"scripts.commit=cz\""

# Add test scripts - organized by test type
npm pkg set "scripts.test=node --experimental-vm-modules node_modules/jest/bin/jest.js"
handle_error $? "Failed to add test script to package.json" "npm pkg set \"scripts.test=node --experimental-vm-modules node_modules/jest/bin/jest.js\""

npm pkg set "scripts.test:watch=node --experimental-vm-modules node_modules/jest/bin/jest.js --watch"
handle_error $? "Failed to add test:watch script to package.json" "npm pkg set \"scripts.test:watch=node --experimental-vm-modules node_modules/jest/bin/jest.js --watch\""

# Unit tests scripts
npm pkg set "scripts.test:unit=node --experimental-vm-modules node_modules/jest/bin/jest.js src"
handle_error $? "Failed to add test:unit script to package.json" "npm pkg set \"scripts.test:unit=node --experimental-vm-modules node_modules/jest/bin/jest.js src\""

npm pkg set "scripts.test:unit:watch=node --experimental-vm-modules node_modules/jest/bin/jest.js src --watch"
handle_error $? "Failed to add test:unit:watch script to package.json" "npm pkg set \"scripts.test:unit:watch=node --experimental-vm-modules node_modules/jest/bin/jest.js src --watch\""

npm pkg set "scripts.test:unit:coverage=node --experimental-vm-modules node_modules/jest/bin/jest.js src --coverage"
handle_error $? "Failed to add test:unit:coverage script to package.json" "npm pkg set \"scripts.test:unit:coverage=node --experimental-vm-modules node_modules/jest/bin/jest.js src --coverage\""

# Integration tests scripts
npm pkg set "scripts.test:integration=node --experimental-vm-modules node_modules/jest/bin/jest.js tests/integration"
handle_error $? "Failed to add test:integration script to package.json" "npm pkg set \"scripts.test:integration=node --experimental-vm-modules node_modules/jest/bin/jest.js tests/integration\""

npm pkg set "scripts.test:integration:watch=node --experimental-vm-modules node_modules/jest/bin/jest.js tests/integration --watch"
handle_error $? "Failed to add test:integration:watch script to package.json" "npm pkg set \"scripts.test:integration:watch=node --experimental-vm-modules node_modules/jest/bin/jest.js tests/integration --watch\""

# E2E tests scripts
npm pkg set "scripts.test:e2e=node --experimental-vm-modules node_modules/jest/bin/jest.js tests/e2e"
handle_error $? "Failed to add test:e2e script to package.json" "npm pkg set \"scripts.test:e2e=node --experimental-vm-modules node_modules/jest/bin/jest.js tests/e2e\""

npm pkg set "scripts.test:e2e:watch=node --experimental-vm-modules node_modules/jest/bin/jest.js tests/e2e --watch"
handle_error $? "Failed to add test:e2e:watch script to package.json" "npm pkg set \"scripts.test:e2e:watch=node --experimental-vm-modules node_modules/jest/bin/jest.js tests/e2e --watch\""

# CI tests script
npm pkg set "scripts.test:ci=node --experimental-vm-modules node_modules/jest/bin/jest.js --ci --runInBand --forceExit --coverage src tests/integration"
handle_error $? "Failed to add test:ci script to package.json" "npm pkg set \"scripts.test:ci=node --experimental-vm-modules node_modules/jest/bin/jest.js --ci --runInBand --forceExit --coverage src tests/integration\""

# Coverage for all tests
npm pkg set "scripts.test:coverage=node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage"
handle_error $? "Failed to add test:coverage script to package.json" "npm pkg set \"scripts.test:coverage=node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage\""

# Ensure setup:quality script is added
npm pkg set "scripts.setup:quality=chmod +x tools/scripts/quality/setup-code-quality.sh && tools/scripts/quality/setup-code-quality.sh"
handle_error $? "Failed to add setup:quality script to package.json" "npm pkg set \"scripts.setup:quality=chmod +x tools/scripts/quality/setup-code-quality.sh && tools/scripts/quality/setup-code-quality.sh\""

# Configure Commitizen
echo -e "  Configuring Commitizen..."
npm pkg set "config.commitizen.path=./node_modules/cz-conventional-changelog"
handle_error $? "Failed to configure Commitizen" "npm pkg set \"config.commitizen.path=./node_modules/cz-conventional-changelog\""

echo -e "  ${GREEN}✓ Scripts added to package.json${NC}"
echo -e "  ${GREEN}✓ Commitizen configured${NC}"

# Initialize Husky and configure hooks
echo -e "${YELLOW}Step 4: Configuring Husky...${NC}"

# Check if Git is initialized
if [ ! -d .git ]; then
  echo -e "  ${YELLOW}⚠ Git repository not found. Initializing...${NC}"
  git init
  handle_error $? "Failed to initialize Git repository" "git init"
else
  echo -e "  ${GREEN}✓ Git repository already initialized${NC}"
fi

# Check if .gitignore exists, create if not
if [ ! -f .gitignore ]; then
  echo -e "  Creating basic .gitignore file..."
  cat > .gitignore << 'EOL'
# Dependencies
node_modules
npm-debug.log
yarn-debug.log
yarn-error.log
.pnpm-debug.log

# Build outputs
dist
build
out
.next
.nuxt

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs
*.log

# OS specific files
.DS_Store
Thumbs.db

# Editors and IDEs
.idea
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
.vs
*.swp
*.swo

# Testing
coverage
.coverage
.nyc_output

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
.cache
.parcel-cache

# Others
.VSCodeCounter
/tools/temp
EOL
  handle_error $? "Failed to create .gitignore" "cat > .gitignore"
  echo -e "  ${GREEN}✓ .gitignore file created${NC}"
else
  echo -e "  ${GREEN}✓ .gitignore file already exists${NC}"
fi

# Initialize Husky
echo -e "  Initializing Husky..."
npx husky init
handle_error $? "Failed to initialize Husky" "npx husky init"

# Create pre-commit hook
echo -e "  Configuring pre-commit hook..."
echo "npx lint-staged" > .husky/pre-commit
handle_error $? "Failed to create pre-commit hook" "\"npx lint-staged\" > .husky/pre-commit"
echo -e "  ${GREEN}✓ pre-commit hook configured${NC}"

# Create commit-msg hook
echo -e "  Configuring commit-msg hook..."
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
handle_error $? "Failed to create commit-msg hook" "\"npx --no -- commitlint --edit \$1\" > .husky/commit-msg"
echo -e "  ${GREEN}✓ commit-msg hook configured${NC}"

# Create prepare-commit-msg hook for Commitizen (optional)
echo -e "  Configuring prepare-commit-msg hook for Commitizen..."
echo "exec < /dev/tty && npx cz --hook || true" > .husky/prepare-commit-msg
handle_error $? "Failed to create prepare-commit-msg hook" "\"exec < /dev/tty && npx cz --hook || true\" > .husky/prepare-commit-msg"
echo -e "  ${GREEN}✓ prepare-commit-msg hook configured${NC}"

# Create pre-push hook to run tests (optional)
echo -e "  Configuring pre-push hook to run tests..."
echo "npm test:ci" > .husky/pre-push
handle_error $? "Failed to create pre-push hook" "\"npm test:ci\" > .husky/pre-push"
echo -e "  ${GREEN}✓ pre-push hook configured${NC}"

# Make hooks executable
chmod +x .husky/pre-commit
handle_error $? "Failed to make pre-commit hook executable" "chmod +x .husky/pre-commit"

chmod +x .husky/commit-msg
handle_error $? "Failed to make commit-msg hook executable" "chmod +x .husky/commit-msg"

chmod +x .husky/prepare-commit-msg
handle_error $? "Failed to make prepare-commit-msg hook executable" "chmod +x .husky/prepare-commit-msg"

chmod +x .husky/pre-push
handle_error $? "Failed to make pre-push hook executable" "chmod +x .husky/pre-push"

# Create basic large test directory structure if it doesn't exist
if [ ! -d "tests/integration" ] && [ ! -d "tests/e2e" ]; then
  echo -e "  Creating test directory structure..."
  mkdir -p "tests/integration"
  mkdir -p "tests/e2e"
  mkdir -p "__tests__"
  
  # Sample integration test
  cat > "tests/integration/sample.integration.test.js" << 'EOL'
/**
 * Sample integration test file
 * 
 * Integration tests verify that different parts of the system work together.
 */

describe('Sample Integration Test', () => {
  test('example integration test', () => {
    // This would typically test interactions between components
    expect(true).toBe(true);
  });
});
EOL

  # Sample E2E test
  cat > "tests/e2e/sample.e2e.test.js" << 'EOL'
/**
 * Sample E2E test file
 * 
 * End-to-end tests verify the system works from a user's perspective.
 */

describe('Sample E2E Test', () => {
  test('example e2e test', () => {
    // This would typically test the entire application flow
    expect(true).toBe(true);
  });
});
EOL

  # Create a sample unitary test file
  cat > "__tests__/sample.test.js" << 'EOL'
/**
 * Sample test file
 * 
 * This is just a placeholder to demonstrate Jest unitary testing.
 * Replace with your actual unit tests.
 * And move this directory '__tests__' colocalized near to tested code.
 */

describe('Sample Test', () => {
  test('basic test example', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('async test example', async () => {
    const data = await Promise.resolve('test');
    expect(data).toBe('test');
  });
});
EOL

  handle_error $? "Failed to create sample test files" "cat > sample test files"
  echo -e "  ${GREEN}✓ Test directory structure created${NC}"
else
  echo -e "  ${GREEN}✓ Test directories already exist${NC}"
fi

# Final message
echo -e "${GREEN}=== Configuration completed successfully ===${NC}"
echo -e "The complete code quality system has been configured correctly."
echo -e "Now you can run:"

# Linting & formatting commands
echo -e "  - ${BLUE}npm run lint${NC} to check for code issues"
echo -e "  - ${BLUE}npm run lint:fix${NC} to automatically fix code issues"
echo -e "  - ${BLUE}npm run format${NC} to format code according to standards"

# Commit commands
echo -e "  - ${BLUE}npm run commit${NC} or ${BLUE}git cz${NC} to create conventional commits with Commitizen"

# Standard test commands
echo -e "  - ${BLUE}npm test${NC} to run all Jest tests"
echo -e "  - ${BLUE}npm run test:watch${NC} to run all tests in watch mode"
echo -e "  - ${BLUE}npm run test:coverage${NC} to run all tests with coverage report"

# Unit test commands
echo -e "  - ${BLUE}npm run test:unit${NC} to run unit tests (in src folder)"
echo -e "  - ${BLUE}npm run test:unit:watch${NC} to run unit tests in watch mode"
echo -e "  - ${BLUE}npm run test:unit:coverage${NC} to run unit tests with coverage report"

# Integration test commands
echo -e "  - ${BLUE}npm run test:integration${NC} to run integration tests"
echo -e "  - ${BLUE}npm run test:integration:watch${NC} to run integration tests in watch mode"

# E2E test commands
echo -e "  - ${BLUE}npm run test:e2e${NC} to run end-to-end tests"
echo -e "  - ${BLUE}npm run test:e2e:watch${NC} to run end-to-end tests in watch mode"

# CI test command
echo -e "  - ${BLUE}npm run test:ci${NC} to run tests optimized for CI environments"

# Benchmark
echo -e "  - The ${BLUE}benchmark${NC} library is available for performance testing"
echo -e ""

# Git hooks information
echo -e "Git hooks have been set up to:"
echo -e "  - Automatically verify code using lint-staged before each commit"
echo -e "  - Start Commitizen automatically when creating commits (via prepare-commit-msg hook)"
echo -e "  - Validate commit messages follow conventional format"
echo -e "  - Run tests before pushing to remote repositories"
echo -e ""

# Conclusion
echo -e "Your code quality will be maintained with standardized formatting, testing, and early error detection."
echo -e "For more details, refer to the documentation in tools/scripts/quality/README.md"