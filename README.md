# internship-tracker-backend

The backend for the COMP208 internship tracker group project

## 🟩 Backend (NestJS + Prisma)

Responsible for:

- Authentication (JWT verification)
- Password hashing (bcrypt)
- Authorization (user ownership checks)
- Application lifecycle logic
- Analytics aggregation queries
- Emitting WebSocket events
- Input validation

This is your system brain.

---

## 🟨 Database (Supabase PostgreSQL)

Responsible for:

- Persistent storage
- Relational integrity
- Index performance
- Query execution

It does not:

- Know about JWT
- Emit events
- Perform business logic

---

## Core Stack

| Frontend | Backend | Infrastructure |
| --- | --- | --- |
| React (Vite) | NestJS | Docker (development only) |
| TypeScript | Prisma ORM | Vercel (frontend) |
| React Query | PostgreSQL (Supabase) | Render (backend) |
| Axios | JWT (simple access token) | Supabase (database) |
|  | bcrypt |  |

---

## 🟩 Backend

| NestJS | Modular backend framework (application core) |
| --- | --- |
| Exposes REST endpoints | Implements business logic |
| Handles authentication | Validates requests |
| Structures code into modules |  |

This is your system brain.

| Prisma ORM | Database abstraction and type-safe query layer |
| --- | --- |
| Translates TypeScript queries → SQL | Enforces schema consistency |
| Prevents raw SQL errors | Generates typed database client |

Important:
Prisma = bridge between NestJS and PostgreSQL.

| PostgreSQL (Supabase) | Persistent relational data store |
| --- | --- |
| Stores users | Stores applications |
| Stores status history | Executes SQL queries |

Supabase:

| Managed hosting | Backups | Monitoring |
| --- | --- | --- |

| JWT (Access Token Only) | Stateless authentication mechanism |
| --- | --- |
| Encodes user identity | Sent in Authorization header |
| Verified on every request | No server-side sessions required |

Keeps backend stateless.

| bcrypt | Password hashing algorithm |
| --- | --- |
| Hashes user passwords before storage | Protects against plaintext leaks |
| Slow hashing to prevent brute force |  |

Security best practice.

---

## 🟪 Infrastructure

| Docker (Development Only) | Local environment standardisation |
| --- | --- |
| Ensures consistent Node version | Avoids “works on my machine” issues |
| Containerises backend for local testing |  |

Not used in production.

| Render (Backend Hosting) | Node.js server hosting |
| --- | --- |
| Runs NestJS server | Handles HTTPS |
| Manages environment variables | Keeps API publicly accessible |

| Supabase (Database Hosting) | Managed PostgreSQL provider |
| --- | --- |
| Cloud database hosting | Backups |
| Admin UI | Secure connection endpoint |

## Nest README
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
