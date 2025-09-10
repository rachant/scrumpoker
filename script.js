// Get session ID from URL parameter or use default
const urlParams = new URLSearchParams(window.location.search);
const SESSION_ID = urlParams.get('session') || 'team1';

class ScrumPoker {
    constructor() {
        this.selectedCard = null;
        this.teamMembers = [{ name: 'You', estimate: null, isUser: true }];
        this.cardsRevealed = false;
        this.currentStory = '';
        this.sessionId = SESSION_ID;
        this.init();
    }

    init() {
        this.loadSession();
        this.bindEvents();
        this.updateTeamDisplay();
        this.updateStoryDisplay();
        this.restoreCardSelection();
        this.updateSessionInfo();
        this.checkRevealButton();
        this.updateShareLink();
        
        if (this.cardsRevealed) {
            this.showResults();
            document.getElementById('reveal-btn').disabled = true;
        }

        // Auto-sync every 2 seconds to simulate real-time collaboration
        setInterval(() => this.syncSession(), 2000);
    }

    saveSession() {
        const sessionData = {
            selectedCard: this.selectedCard,
            teamMembers: this.teamMembers,
            cardsRevealed: this.cardsRevealed,
            currentStory: this.currentStory,
            lastUpdated: Date.now()
        };
        localStorage.setItem(`scrumPokerSession_${this.sessionId}`, JSON.stringify(sessionData));
        this.updateSessionInfo();
    }

    loadSession() {
        const savedSession = localStorage.getItem(`scrumPokerSession_${this.sessionId}`);
        if (savedSession) {
            try {
                const sessionData = JSON.parse(savedSession);
                this.selectedCard = sessionData.selectedCard;
                this.teamMembers = sessionData.teamMembers || [{ name: 'You', estimate: null, isUser: true }];
                this.cardsRevealed = sessionData.cardsRevealed || false;
                this.currentStory = sessionData.currentStory || '';
            } catch (error) {
                console.log('Could not load saved session:', error);
                this.clearSession();
            }
        }
    }

    syncSession() {
        // Check if session was updated by another user in same browser
        const savedSession = localStorage.getItem(`scrumPokerSession_${this.sessionId}`);
        if (savedSession) {
            try {
                const sessionData = JSON.parse(savedSession);
                const currentLastUpdated = sessionData.lastUpdated || 0;
                
                // If this is a newer update, sync the data
                if (currentLastUpdated > (this.lastSyncTime || 0)) {
                    this.lastSyncTime = currentLastUpdated;
                    
                    this.teamMembers = sessionData.teamMembers || this.teamMembers;
                    this.cardsRevealed = sessionData.cardsRevealed || false;
                    this.currentStory = sessionData.currentStory || '';
                    
                    this.updateTeamDisplay();
                    this.updateStoryDisplay();
                    this.checkRevealButton();
                    
                    if (this.cardsRevealed) {
                        this.showResults();
                        document.getElementById('reveal-btn').disabled = true;
                    }
                }
            } catch (error) {
                // Ignore sync errors
            }
        }
    }

    clearSession() {
        localStorage.removeItem(`scrumPokerSession_${this.sessionId}`);
    }

    updateSessionInfo() {
        const savedSession = localStorage.getItem(`scrumPokerSession_${this.sessionId}`);
        const sessionInfoDiv = document.getElementById('session-info');
        const lastSavedSpan = document.getElementById('last-saved');
        const sessionIdSpan = document.getElementById('session-id');
        
        if (savedSession) {
            try {
                const sessionData = JSON.parse(savedSession);
                const lastUpdated = new Date(sessionData.lastUpdated || Date.now());
                lastSavedSpan.textContent = lastUpdated.toLocaleString();
                sessionIdSpan.textContent = this.sessionId;
                sessionInfoDiv.style.display = 'block';
            } catch (error) {
                sessionInfoDiv.style.display = 'none';
            }
        } else {
            sessionIdSpan.textContent = this.sessionId;
            lastSavedSpan.textContent = 'No data saved yet';
            sessionInfoDiv.style.display = 'block';
        }
    }

    updateShareLink() {
        const shareUrlInput = document.getElementById('share-url');
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('session', this.sessionId);
        shareUrlInput.value = currentUrl.toString();
    }

    shareSession() {
        const shareUrl = document.getElementById('share-url').value;
        
        if (navigator.share) {
            navigator.share({
                title: 'Scrum Poker Session',
                text: `Join our scrum poker session: ${this.sessionId}`,
                url: shareUrl
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Session URL copied to clipboard! Share this with your team.');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Session URL copied to clipboard! Share this with your team.');
            });
        }
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
        document.getElementById('clear-session-btn').addEventListener('click', () => this.clearSessionAndReset());
        document.getElementById('share-btn').addEventListener('click', () => this.shareSession());

        // Story description auto-save
        document.getElementById('story-description').addEventListener('input', (e) => {
            this.currentStory = e.target.value;
            this.saveSession();
        });
    }

    selectCard(cardElement) {
        if (this.cardsRevealed) return;

        this.selectedCard = cardElement.getAttribute('data-value');
        this.teamMembers[0].estimate = this.selectedCard;
        this.updateTeamDisplay();
        this.saveSession();
    }

    addMember() {
        const memberName = prompt('Enter team member name:');
        if (memberName) {
            this.teamMembers.push({ name: memberName, estimate: null, isUser: false });
            this.updateTeamDisplay();
            this.checkRevealButton();
            this.saveSession();
        }
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
            this.saveSession();
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
        this.saveSession();
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

    clearSession() {
        localStorage.removeItem('scrumPokerSession');
    }

    clearSessionAndReset() {
        const savedSession = localStorage.getItem('scrumPokerSession');
        let confirmMessage = 'This will permanently clear all saved data and reset everything. Are you sure?';
        
        if (savedSession) {
            try {
                const sessionData = JSON.parse(savedSession);
                const lastUpdated = new Date(sessionData.lastUpdated || Date.now());
                confirmMessage += `\n\nLast saved: ${lastUpdated.toLocaleString()}`;
                
                if (sessionData.teamMembers && sessionData.teamMembers.length > 1) {
                    confirmMessage += `\nTeam members: ${sessionData.teamMembers.length}`;
                }
                
                if (sessionData.currentStory) {
                    confirmMessage += `\nCurrent story: "${sessionData.currentStory.substring(0, 50)}${sessionData.currentStory.length > 50 ? '...' : ''}"`;
                }
            } catch (error) {
                // If we can't parse the session, just use the basic message
            }
        }
        
        if (confirm(confirmMessage)) {
            this.clearSession();
            // Reset to initial state
            this.selectedCard = null;
            this.teamMembers = [{ name: 'You', estimate: null, isUser: true }];
            this.cardsRevealed = false;
            this.currentStory = '';
            
            // Update UI
            document.querySelectorAll('.card').forEach(card => {
                card.classList.remove('selected');
            });
            document.getElementById('story-description').value = '';
            document.getElementById('results').style.display = 'none';
            
            this.updateTeamDisplay();
            this.checkRevealButton();
            
            // Hide session info
            document.getElementById('session-info').style.display = 'none';
            
            // Show confirmation
            setTimeout(() => {
                alert('Session cleared successfully. All data has been permanently removed.');
            }, 100);
        }
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
        this.currentStory = '';
        
        this.saveSession();
    }

    generateRandomEstimate() {
        const estimates = ['0', '1', '2', '3', '5', '8'];
        return estimates[Math.floor(Math.random() * estimates.length)];
    }

    updateStoryDisplay() {
        document.getElementById('story-description').value = this.currentStory;
    }

    restoreCardSelection() {
        if (this.selectedCard) {
            const card = document.querySelector(`[data-value="${this.selectedCard}"]`);
            if (card) {
                card.classList.add('selected');
            }
        }
    }
}

// Initialize the application
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
