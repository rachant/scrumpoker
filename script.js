class ScrumPoker {
    constructor() {
        this.selectedCard = null;
        this.teamMembers = [{ name: 'You', estimate: null, isUser: true }];
        this.cardsRevealed = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateTeamDisplay();
    }

    bindEvents() {
        // Card selection
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (e) => this.selectCard(e.target));
        });

        // Control buttons
        document.getElementById('reveal-btn').addEventListener('click', () => this.revealCards());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetRound());
        document.getElementById('add-member-btn').addEventListener('click', () => this.addTeamMember());
    }

    selectCard(cardElement) {
        if (this.cardsRevealed) return;

        // Remove previous selection
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
        });

        // Select new card
        cardElement.classList.add('selected');
        this.selectedCard = cardElement.dataset.value;

        // Update user's estimate
        this.teamMembers[0].estimate = this.selectedCard;
        this.updateTeamDisplay();
        this.checkRevealButton();
    }

    addTeamMember() {
        const name = prompt('Enter team member name:');
        if (name && name.trim()) {
            this.teamMembers.push({
                name: name.trim(),
                estimate: this.generateRandomEstimate(),
                isUser: false
            });
            this.updateTeamDisplay();
            this.checkRevealButton();
        }
    }

    generateRandomEstimate() {
        const estimates = ['0', '0.5', '1', '2', '3', '5', '8', '13', '21', '?'];
        return estimates[Math.floor(Math.random() * estimates.length)];
    }

    updateTeamDisplay() {
        const teamContainer = document.querySelector('.team-members');
        teamContainer.innerHTML = '';

        this.teamMembers.forEach((member, index) => {
            const memberElement = document.createElement('div');
            memberElement.className = 'member';
            
            const estimateClass = this.cardsRevealed ? '' : 'hidden';
            const estimateText = member.estimate || '-';
            const displayEstimate = this.cardsRevealed ? estimateText : (member.estimate ? '✓' : '-');

            memberElement.innerHTML = `
                <span class="member-name">${member.name}</span>
                <span class="member-estimate ${estimateClass}">${displayEstimate}</span>
            `;

            if (!member.isUser) {
                const removeBtn = document.createElement('button');
                removeBtn.textContent = '×';
                removeBtn.style.cssText = `
                    background: #e53e3e;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 25px;
                    height: 25px;
                    font-size: 14px;
                    cursor: pointer;
                    margin-left: 10px;
                    min-width: auto;
                `;
                removeBtn.addEventListener('click', () => this.removeMember(index));
                memberElement.appendChild(removeBtn);
            }

            teamContainer.appendChild(memberElement);
        });
    }

    removeMember(index) {
        if (index > 0) { // Don't remove the user (index 0)
            this.teamMembers.splice(index, 1);
            this.updateTeamDisplay();
            this.checkRevealButton();
        }
    }

    checkRevealButton() {
        const revealBtn = document.getElementById('reveal-btn');
        const hasEstimates = this.teamMembers.some(member => member.estimate !== null);
        revealBtn.disabled = !hasEstimates || this.cardsRevealed;
    }

    revealCards() {
        this.cardsRevealed = true;
        this.updateTeamDisplay();
        this.showResults();
        
        document.getElementById('reveal-btn').disabled = true;
    }

    showResults() {
        const resultsDiv = document.getElementById('results');
        const estimates = this.teamMembers
            .map(member => member.estimate)
            .filter(estimate => estimate && estimate !== '?' && estimate !== 'coffee')
            .map(estimate => parseFloat(estimate))
            .filter(estimate => !isNaN(estimate));

        if (estimates.length > 0) {
            const average = (estimates.reduce((sum, val) => sum + val, 0) / estimates.length).toFixed(1);
            const mostCommon = this.getMostCommon(estimates);

            document.getElementById('average').textContent = average;
            document.getElementById('most-common').textContent = mostCommon;
        } else {
            document.getElementById('average').textContent = '-';
            document.getElementById('most-common').textContent = '-';
        }

        resultsDiv.style.display = 'block';
    }

    getMostCommon(arr) {
        const frequency = {};
        let maxCount = 0;
        let mostCommon = arr[0];

        arr.forEach(num => {
            frequency[num] = (frequency[num] || 0) + 1;
            if (frequency[num] > maxCount) {
                maxCount = frequency[num];
                mostCommon = num;
            }
        });

        return mostCommon;
    }

    resetRound() {
        // Clear card selection
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
        });

        // Reset estimates
        this.teamMembers.forEach(member => {
            if (!member.isUser) {
                member.estimate = this.generateRandomEstimate();
            } else {
                member.estimate = null;
            }
        });

        // Reset state
        this.selectedCard = null;
        this.cardsRevealed = false;

        // Update UI
        this.updateTeamDisplay();
        this.checkRevealButton();
        document.getElementById('results').style.display = 'none';

        // Clear story description
        document.getElementById('story-description').value = '';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ScrumPoker();
});

// Add some helpful keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Press 'R' to reveal cards
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        const revealBtn = document.getElementById('reveal-btn');
        if (!revealBtn.disabled) {
            revealBtn.click();
        }
    }
    
    // Press 'Escape' to reset
    if (e.key === 'Escape') {
        document.getElementById('reset-btn').click();
    }
    
    // Number keys to select cards
    const numberKeys = ['0', '1', '2', '3', '5', '8'];
    if (numberKeys.includes(e.key)) {
        const card = document.querySelector(`[data-value="${e.key}"]`);
        if (card) {
            card.click();
        }
    }
});
