# Scrum Poker

A web-based scrum poker application for agile teams to estimate story points collaboratively.

## Features

- **Interactive Card Selection**: Choose from standard Fibonacci sequence cards (0, ½, 1, 2, 3, 5, 8, 13, 21) plus special cards (?, ☕)
- **Team Management**: Add and remove team members dynamically
- **Story Management**: Enter and track user stories being estimated
- **Results Analytics**: View average estimates and most common votes
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: 
  - Number keys (0-8) to select cards
  - 'R' to reveal cards
  - 'Escape' to reset round

## Getting Started

1. Open `index.html` in your web browser
2. Enter a user story description in the text area
3. Select your estimate by clicking on a card
4. Add team members using the "Add Team Member" button
5. Click "Reveal Cards" to see all estimates
6. View the results and discussion outcomes
7. Click "Reset Round" to start a new estimation

## Project Structure

```
scrumpoker/
├── index.html          # Main HTML file
├── styles.css          # Styling and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## Technologies Used

- HTML5
- CSS3 (Grid, Flexbox, Gradients)
- Vanilla JavaScript (ES6+ Classes)

## Browser Support

This application works in all modern browsers that support:
- CSS Grid
- ES6 Classes
- Modern JavaScript features

## Development

To modify or extend this application:

1. **HTML Structure**: Modify `index.html` for layout changes
2. **Styling**: Update `styles.css` for visual modifications
3. **Functionality**: Enhance `script.js` for new features

## Future Enhancements

- Real-time collaboration with WebSockets
- Story persistence and history
- Export results to CSV/PDF
- Timer for estimation rounds
- Custom card sets
- Team statistics and analytics

## License

This project is open source and available under the MIT License.
