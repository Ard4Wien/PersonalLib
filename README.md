<p align="center">
  <img src="public/images/logo.png" width="120" alt="PersonalLib Logo" />
</p>

<h1 align="center">PersonalLib</h1>

<p align="center">
  <b>English Version</b> • <a href="./README.tr.md">Türkçe Versiyon</a>
</p>

<p align="center">
  <a href="https://github.com/Ard4Wien/PersonalLib/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Ard4Wien/PersonalLib?style=flat-square" alt="License" /></a>
  <a href="https://github.com/Ard4Wien/PersonalLib/releases"><img src="https://img.shields.io/github/v/release/Ard4Wien/PersonalLib?style=flat-square" alt="Release" /></a>
  <img src="https://img.shields.io/badge/platform-Web%20%7C%20Mobile-blue?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/github/watchers/Ard4Wien/PersonalLib?style=flat-square" alt="Watchers" />
</p>

---

PersonalLib is a minimalist and secure platform designed to consolidate your consumption of various media types into a single, unified interface. It serves as both a private tracking tool and a public portfolio to showcase your library to the world.

## Features

- **Multi-Media Tracking**: Dedicated sections for movies, TV series, books, manga, and anime.
- **Progress Management**: Track your current status with granular labels such as Reading, Watching, Completed, or Wishlist.
- **Advanced Validation**: Real-time SMTP email verification via Abstract API and debounced username availability checks.
- **Adaptive Interface**: Native support for dark and light modes with a consistent, premium design language.
- **Public Portfolios**: Generate shareable profiles to showcase your curated collections with privacy controls.
- **Security Hardening**: Implementation of Content Security Policy (CSP), JWT algorithm verification, and XSS prevention.

## Tech Stack

PersonalLib is built with a modern, type-safe stack for maximum performance and reliability:

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion.
- **Backend**: Next.js API Routes (Serverless), Prisma ORM.
- **Database**: PostgreSQL hosted on Neon.
- **Authentication**: Auth.js (NextAuth) with secure session management.
- **Validation**: Zod schema validation and Abstract API integration.

## Screenshots

<p align="center">
  <img src="public/screenshots/landing.png" width="800" alt="Landing Page" />
  <br />
  <img src="public/screenshots/dashboard.png" width="800" alt="Dashboard" />
  <br />
  <img src="public/screenshots/portfolio.png" width="800" alt="User Portfolio" />
</p>

## Project Structure

```text
src/
├── app/               # Next.js App Router (Pages and API Routes)
│   ├── api/           # Serverless backend endpoints
│   ├── (dashboard)/   # Authenticated user dashboard
│   └── portfolio/     # Public/Private user profiles
├── components/        # Reusable UI and layout components
│   ├── layout/        # Navigation, header, and wrappers
│   ├── media/         # Media-specific cards and grids
│   └── ui/            # Base Tailwind-styled components
├── lib/               # Utility functions, validators, and clients
├── context/           # React Context providers
└── types/             # Shared TypeScript interfaces and DTOs
```

## Getting Started

To set up a local development environment:

1. Clone the repository:
   ```bash
   git clone https://github.com/Ard4Wien/PersonalLib.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in a `.env` file (Database URL, Auth secrets, API keys).

4. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Security

PersonalLib prioritizes data integrity and user safety:
- **Sanitization**: All user inputs are validated via Zod schemas to prevent injection.
- **Content Security Policy**: Custom CSP headers are enforced to mitigate XSS risks.
- **JWT Protection**: Strict HS256 algorithm verification is implemented for session tokens.
- **Rate Limiting**: Protection against brute-force attacks on authentication endpoints.

## Help

For troubleshooting or questions regarding the setup:
- Review the [documentation](https://github.com/Ard4Wien/PersonalLib/wiki).
- Open a [technical issue](https://github.com/Ard4Wien/PersonalLib/issues) with detailed logs.

## Contributing

Contributions are welcome to enhance PersonalLib:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.
- You are free to share and adapt the material for non-commercial purposes.
- Attribution to the original author is required.

---

<p align="center">
  Developed with ❤️ by <a href="https://github.com/Ard4Wien">ArdaWien</a>
</p>
