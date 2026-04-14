# Insight Curator | Feature Voting Board

A modern, responsive, single-page feature voting application built with HTML, Tailwind CSS, and Vanilla JavaScript. The Insight Curator helps product teams gather, track, and prioritize feature requests from users.

## Features

- **Single Page Application (SPA):** Seamless navigation using hash-based routing.
- **User Authentication:** Simulated login and registration using `localStorage`.
- **Feature Voting System:** Upvote ideas and see real-time sorting based on popularity.
- **Add New Ideas:** Easily pitch new features with an intuitive suggestion form.
- **Sort Options:** Navigate features by "Most Voted", "Newest First", and "In Review".
- **Changelog & Statistics:** View quick stats (total ideas, total votes) and the most recent feed of submissions.
- **Data Persistence:** Uses `localStorage` to securely store user data, features, and votes across sessions.
- **Modern UI:** Glassmorphism headers, Tailwind CSS utility classes, and Material Symbols for a sleek, futuristic experience.

## Technology Stack

- **Frontend:** HTML5, Vanilla JavaScript, CSS3
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (imported via CDN)
- **Icons & Fonts:** Google Fonts (Inter) & Material Symbols Outlined
- **Database:** Browser `localStorage`

## File Structure

```text
Product-Feature-Voter/
│
├── index.html          # Main entry point and layout
├── static/
│   ├── style.css       # Custom CSS variables and styles
│   └── script.js       # Core application logic, routing, and data handling
└── README.md           # Project documentation
```

## How to Run Locally

Since this app uses purely client-side rendering and `localStorage`, there is no complex build or server setup required!

1. Clone or download the repository.
2. Navigate to the project directory: `Product-Feature-Voter`.
3. Open `index.html` in your favorite web browser.

No server setup required.

## Usage Guide

- **Registration/Login:** Follow the sign-in prompts to create a mock user account. Note: all data stays local to your browser.
- **Voting:** Click on the vote count bubble next to a feature to add your vote. 
- **Sorting Ideas:** Use the dropdown on the top right above the features list to sort ideas dynamically.
- **Adding an Idea:** Scroll down to the bottom section, fill out the idea form, and hit "Add Idea".

## License

This project is open-source and free to use.
