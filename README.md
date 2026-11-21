---
title: Madar Backend
emoji: 🚀
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# Madar Backend Project
Telegram Scraper and Cron Jobs Service.

---

# Madar Jobs — Backend

Express + TypeScript API behind [Madar Jobs](https://madar-jobs.vercel.app). It scrapes job posts that labor offices publish on Telegram channels, turns the unstructured text into structured job data with an LLM, stores it in MongoDB, and serves it to the frontend.

- **Frontend:** https://github.com/Helmy-Ezzat/madar_frontend

## What I built

- Scheduled scraping of Telegram channels (node-cron + Telegram API)
- AI parsing and summarization of unstructured job posts (Groq)
- Jobs REST API with filtering and pagination
- User authentication with Firebase Admin, plus rate limiting
- Dockerfile for deployment

## Stack

Express, TypeScript, MongoDB (Mongoose), Groq SDK, node-cron, Firebase Admin, Docker

## Run locally

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev
```
