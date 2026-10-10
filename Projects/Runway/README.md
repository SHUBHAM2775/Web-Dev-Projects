# Runway

A simple income and expense tracker for people whose income doesn't arrive on a schedule: freelancers, side-hustlers and commission earners.

Most budgeting tools assume a steady paycheck. Runway shows the one number an irregular earner actually needs: **how many days you can keep spending at your current rate before the money runs out.**

## Features

- Log income entries (amount, source or client, date)
- Log expense entries (amount, category, date)
- Live dashboard with your **current balance** and **runway** (days left)
- Runway is calculated from your average daily spend over the last 14 days, or from all available history if you have less than 14 days of data
- Recent entries list, colour-coded for income and expenses
- Data saved in the browser with `localStorage`, so it survives a page refresh
- Amounts shown in naira (₦)

## Tech

Plain HTML, CSS and vanilla JavaScript. No frameworks, no build step, no backend. Colours are defined as design tokens (primary, accent and error roles) and applied through CSS variables.

## How to run

Open `index.html` in a browser. Nothing to install.

## Using it

1. Enter an amount, a source and a date under **Log Income**, then click **Add Income**.
2. Enter an amount, pick a category and a date under **Log Expense**, then click **Add Expense**.
3. Watch the balance and the **Runway Left** number update.

## Why I built it

I built Runway during the Ship & Found Bootcamp as a first version of a tool for irregular earners. Forecasting, budgets and multi-currency support were left out on purpose so the core idea (the runway number) could be tested first.

## Author

John David
