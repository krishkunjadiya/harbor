# Contributing to Harbor

Thank you for your interest in contributing to Harbor! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please review our [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing. All contributors are expected to adhere to these standards.

## Getting Started

### 1. Fork and Clone
```bash
git clone https://github.com/yourusername/harbor.git
cd harbor
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/your-bug-fix
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Make Your Changes
Follow the code standards outlined below.

## Code Standards

### TypeScript & JavaScript
- Use TypeScript with strict mode enabled (`strict: true` in tsconfig.json)
- Use `const` by default, `let` when needed, never `var`
- Follow ESLint configuration defined in `.eslintrc.json`
- Use descriptive variable and function names
- Add JSDoc comments for public functions and complex logic

### React Components
- Use functional components with hooks
- Use TypeScript for prop types (prefer interfaces over type aliases for components)
- Follow the Single Responsibility Principle
- Memoize components if they re-render frequently
- Place components in appropriate subdirectories (`/components/ui`, `/components/student`, etc.)

### File Structure
```
component.tsx         # React component with hooks
component.types.ts    # Type definitions
component.test.tsx    # Unit tests
component.stories.ts  # Storybook stories (if applicable)
```

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions/Variables**: camelCase (`getUserData()`, `userData`)
- **Constants**: UPPER_SNAKE_CASE (`API_TIMEOUT`, `MAX_RETRY_ATTEMPTS`)
- **CSS Classes**: kebab-case (`user-profile-header`)

### CSS & Styling
- Use Tailwind CSS for styling (avoid inline styles)
- Follow mobile-first responsive design
- Use provided UI components from `@radix-ui` and `shadcn/ui`
- Maintain consistency with existing color palette and spacing

### Database & Server Actions
- Use TypeScript for type safety
- Write server actions in `/lib/actions/`
- Always validate input on server-side
- Use parameterized queries to prevent SQL injection
- Include error handling with appropriate HTTP status codes

### Python Services
- Follow PEP 8 style guide
- Use type hints for functions
- Document complex logic with docstrings
- Include error handling and logging
- Test functionality before committing

## Commit Guidelines

### Commit Message Format
```
[type](scope): brief description

Optional longer explanation of changes if needed.

Fixes #issue-number
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance, dependencies, build changes

### Examples
```
feat(auth): add password reset functionality
fix(jobs): correct application status filtering
docs(readme): update installation instructions
perf(dashboard): optimize query performance
```

## Testing

### Run Tests
```bash
npm run test
```

### Write Tests
- Create test files alongside components: `Component.test.tsx`
- Use Jest and React Testing Library
- Test user interactions, not implementation details
- Aim for >80% code coverage for new features

### Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('displays user name correctly', () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

## Linting & Formatting

### Check for Issues
```bash
npm run lint
```

### ESLint Rules
- All rules in `.eslintrc.json` must pass
- No `console.log` in production code (use proper logging)
- No unused variables or imports
- No dangling promises

## Pull Request Process

### Before Submitting
1. ✅ Update your branch with latest `main`
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. ✅ Run tests
   ```bash
   npm run test
   ```

3. ✅ Run linter
   ```bash
   npm run lint
   ```

4. ✅ Build the project
   ```bash
   npm run build
   ```

5. ✅ Write clear commit messages (follow commit guidelines)

### Create Pull Request
- Use the provided PR template
- Link related issues with `Fixes #123` or `Relates to #456`
- Provide clear description of changes
- Include screenshots for UI changes
- List any breaking changes

### PR Template
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] No regression issues

## Screenshots
(If applicable)
```

## Review Process

### Code Review
- Maintainers will review your PR
- Address feedback constructively
- Push updates to the same branch
- PR will be merged once approved

### Approval Criteria
- ✅ Code follows standards
- ✅ Tests pass (>80% coverage)
- ✅ No linting errors
- ✅ Documentation updated if needed
- ✅ At least one maintainer approval

## Areas for Contribution

### High Priority
- 🚀 Performance optimizations
- 🐛 Bug fixes
- 📚 Documentation improvements
- ♿ Accessibility enhancements

### Ongoing
- 🧪 Test coverage improvements
- 🎨 UI/UX refinements
- 📊 Analytics and reporting features
- 🔒 Security enhancements

### Ideas to Explore
- Mobile app development
- Advanced candidate matching algorithms
- Interview recording and transcription
- Email notification templates
- Batch operations for recruiters

## Documentation

### Update Documentation When
- Adding new features
- Changing existing behavior
- Adding new environment variables
- Updating dependencies significantly

### Documentation Locations
- **User Guide**: `/md/` directory
- **API Documentation**: Add JSDoc to functions
- **Setup Instructions**: Update README.md
- **Architecture**: Update `/md/COMPLETE-IMPLEMENTATION.md`

## Running Different Environments

### Development
```bash
npm run dev:all  # Harbor + Reactive Resume
npm run dev:harbor  # Harbor only
```

### Production Build
```bash
npm run build
npm start
```

### Staging
Set environment variables and deploy to Vercel staging environment.

## Debugging

### Browser DevTools
- Use React DevTools extension
- Use Next.js DevTools
- Inspect network requests in Network tab

### Server-side Debugging
```typescript
// Use console for logging (removed in production)
console.log('Debug info:', data);

// Or use proper logger
logger.debug('Debug info', { context: data });
```

### Database Debugging
- Use Supabase dashboard to inspect data
- Check RLS policies in Supabase → Authentication → Policies
- View logs in Supabase → Logs

## Performance Guidelines

- Keep bundle size under 500KB (gzipped)
- Use code splitting for routes
- Lazy load components when appropriate
- Optimize images (use WebP format)
- Cache API responses appropriately
- Profile with Lighthouse before optimization

## Security Guidelines

- Never commit sensitive data (.env.local, keys, tokens)
- Validate all user inputs on server-side
- Use parameterized queries
- Implement proper error responses (no stack traces in production)
- Keep dependencies updated
- Review dependency security advisories

## Submitting Issues

### Bug Reports
Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, browser)
- Screenshots/error logs if applicable

### Feature Requests
Include:
- Clear description of the feature
- Use case and benefits
- Example implementation if available
- Relevant mockups or designs

## Community

- **Questions?** Open a discussion or issue
- **Found a security issue?** Email privately (don't open public issue)
- **Need help?** Check existing documentation in `/md/`

## License

By contributing to Harbor, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to:
- Open an issue for clarification
- Ask in pull request comments
- Check existing documentation

Thank you for contributing to Harbor! 🚢
