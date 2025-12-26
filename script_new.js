// Get room ID from URL parameter or generate random room
const urlParams = new URLSearchParams(window.location.search);
const ROOM_ID = urlParams.get('room') || urlParams.get('session') || Math.random().toString(36).substr(2, 8);

class ScrumPokerRoom {
    constructor() {
        this.roomId = ROOM_ID;
        this.userName = this.getUserName();
        this.isObserver = false;
        this.participants = [];
        this.currentStory = '';
        this.votingActive = false;
        this.cardsRevealed = false;
        this.selectedCard = null;
        this.init();
    }

    getUserName() {
        let userName = localStorage.getItem('scrumPokerUserName');
        if (!userName) {
            userName = prompt('Enter your name to join the room:');
            if (!userName || !userName.trim()) {
                userName = 'Anonymous User';
            }
            localStorage.setItem('scrumPokerUserName', userName.trim());
        }
        return userName;
    }

    init() {
        this.loadRoomData();
        this.ensureUserInRoom();
        this.bindEvents();
        this.updateUI();
        this.startSyncTimer();
    }

    bindEvents() {
        // Card selection
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (e) => this.selectCard(e.target));
        });

        // Control buttons
        document.getElementById('start-voting-btn').addEventListener('click', () => this.startVoting());
        document.getElementById('restart-voting-btn').addEventListener('click', () => this.restartVoting());
        document.getElementById('reveal-btn').addEventListener('click', () => this.revealCards());
        document.getElementById('clear-votes-btn').addEventListener('click', () => this.clearVotes());
        document.getElementById('share-btn').addEventListener('click', () => this.shareRoom());
        document.getElementById('reset-room-btn').addEventListener('click', () => this.resetRoom());
        document.getElementById('change-name-btn').addEventListener('click', () => this.changeName());
        document.getElementById('toggle-observer-btn').addEventListener('click', () => this.toggleObserver());

        // Story input
        document.getElementById('story-description').addEventListener('input', (e) => {
            this.currentStory = e.target.value;
            this.saveRoomData();
        });
    }

    loadRoomData() {
        const savedRoom = localStorage.getItem(`scrumPokerRoom_${this.roomId}`);
        if (savedRoom) {
            try {
                const roomData = JSON.parse(savedRoom);
                this.participants = roomData.participants || [];
                this.currentStory = roomData.currentStory || '';
                this.votingActive = roomData.votingActive || false;
                this.cardsRevealed = roomData.cardsRevealed || false;
            } catch (error) {
                console.log('Could not load room data:', error);
            }
        }
    }

    ensureUserInRoom() {
        const existingUser = this.participants.find(p => p.name === this.userName);
        if (!existingUser) {
            this.participants.push({
                name: this.userName,
                estimate: null,
                isCurrentUser: true,
                isObserver: false,
                joinedAt: Date.now()
            });
        } else {
            existingUser.isCurrentUser = true;
            this.isObserver = existingUser.isObserver;
            this.selectedCard = existingUser.estimate;
        }
    }

    saveRoomData() {
        const roomData = {
            participants: this.participants,
            currentStory: this.currentStory,
            votingActive: this.votingActive,
            cardsRevealed: this.cardsRevealed,
            lastUpdated: Date.now()
        };
        localStorage.setItem(`scrumPokerRoom_${this.roomId}`, JSON.stringify(roomData));
    }

    startVoting() {
        if (!this.currentStory.trim()) {
            alert('Please enter a user story before starting voting.');
            return;
        }

        this.votingActive = true;
        this.cardsRevealed = false;
        
        // Clear all estimates
        this.participants.forEach(p => {
            p.estimate = null;
        });
        this.selectedCard = null;

        this.updateUI();
        this.saveRoomData();
    }

    restartVoting() {
        this.startVoting();
    }

    selectCard(cardElement) {
        if (!this.votingActive || this.cardsRevealed || this.isObserver) return;

        // Remove previous selection
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
        });

        // Select new card
        cardElement.classList.add('selected');
        this.selectedCard = cardElement.dataset.value;

        // Update current user's estimate
        const currentUser = this.participants.find(p => p.isCurrentUser);
        if (currentUser) {
            currentUser.estimate = this.selectedCard;
        }

        this.updateUI();
        this.saveRoomData();
    }

    revealCards() {
        this.cardsRevealed = true;
        this.updateUI();
        this.saveRoomData();
    }

    clearVotes() {
        this.participants.forEach(p => {
            p.estimate = null;
        });
        this.selectedCard = null;
        this.cardsRevealed = false;
        
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('selected');
        });

        this.updateUI();
        this.saveRoomData();
    }

    changeName() {
        const newName = prompt('Enter your new name:', this.userName);
        if (newName && newName.trim() && newName.trim() !== this.userName) {
            const oldName = this.userName;
            this.userName = newName.trim();
            localStorage.setItem('scrumPokerUserName', this.userName);

            // Update in participants
            const currentUser = this.participants.find(p => p.name === oldName);
            if (currentUser) {
                currentUser.name = this.userName;
            }

            this.updateUI();
            this.saveRoomData();
        }
    }

    toggleObserver() {
        this.isObserver = !this.isObserver;
        const currentUser = this.participants.find(p => p.isCurrentUser);
        if (currentUser) {
            currentUser.isObserver = this.isObserver;
            if (this.isObserver) {
                currentUser.estimate = null;
                this.selectedCard = null;
                document.querySelectorAll('.card').forEach(card => {
                    card.classList.remove('selected');
                });
            }
        }
        this.updateUI();
        this.saveRoomData();
    }

    shareRoom() {
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Scrum Poker Room',
                text: `Join our scrum poker room: ${this.roomId}`,
                url: shareUrl
            });
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Room URL copied to clipboard! Share this with your team.');
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Room URL copied to clipboard! Share this with your team.');
            });
        }
    }

    resetRoom() {
        if (confirm('This will reset the entire room. All participants and votes will be cleared. Continue?')) {
            localStorage.removeItem(`scrumPokerRoom_${this.roomId}`);
            this.participants = [];
            this.currentStory = '';
            this.votingActive = false;
            this.cardsRevealed = false;
            this.selectedCard = null;
            this.ensureUserInRoom();
            this.updateUI();
            this.saveRoomData();
        }
    }

    updateUI() {
        this.updateRoomInfo();
        this.updateUserInfo();
        this.updateParticipantsList();
        this.updateStorySection();
        this.updateVotingSection();
        this.updateResults();
        this.updateShareLink();
    }

    updateRoomInfo() {
        document.getElementById('room-id').textContent = this.roomId;
        document.getElementById('participants-count').textContent = this.participants.length;
    }

    updateUserInfo() {
        document.getElementById('user-name').textContent = this.userName;
        document.getElementById('user-info').style.display = 'block';
        
        const observerBtn = document.getElementById('toggle-observer-btn');
        observerBtn.textContent = this.isObserver ? 'Exit Observer' : 'Observer Mode';
        observerBtn.style.backgroundColor = this.isObserver ? '#e53e3e' : 'rgba(255, 255, 255, 0.2)';
    }

    updateParticipantsList() {
        const list = document.getElementById('participants-list');
        list.innerHTML = '';

        this.participants.forEach(participant => {
            const div = document.createElement('div');
            div.className = 'participant';
            
            if (participant.estimate && !this.cardsRevealed) {
                div.classList.add('voted');
            }
            
            if (participant.isObserver) {
                div.classList.add('observer');
            }

            const status = participant.isObserver ? 'observer' : 
                          (participant.estimate ? 'voted' : 'pending');
            
            const statusText = participant.isObserver ? 'Observer' :
                              (participant.estimate ? 'Voted' : 'Pending');

            div.innerHTML = `
                <span class="participant-name">${participant.name}${participant.isCurrentUser ? ' (You)' : ''}</span>
                <span class="participant-status status-${status}">${statusText}</span>
            `;

            list.appendChild(div);
        });
    }

    updateStorySection() {
        document.getElementById('story-description').value = this.currentStory;
        
        const votingStatus = document.getElementById('voting-status');
        const startBtn = document.getElementById('start-voting-btn');
        const restartBtn = document.getElementById('restart-voting-btn');

        if (this.votingActive) {
            const votedCount = this.participants.filter(p => !p.isObserver && p.estimate).length;
            const totalVoters = this.participants.filter(p => !p.isObserver).length;
            
            votingStatus.innerHTML = `<p>Voting in progress... ${votedCount}/${totalVoters} voted</p>`;
            votingStatus.className = 'voting-status active';
            startBtn.style.display = 'none';
            restartBtn.style.display = 'inline-block';
        } else {
            votingStatus.innerHTML = '<p>Waiting for story...</p>';
            votingStatus.className = 'voting-status';
            startBtn.style.display = 'inline-block';
            restartBtn.style.display = 'none';
        }
    }

    updateVotingSection() {
        const cardsSection = document.getElementById('cards-section');
        const revealBtn = document.getElementById('reveal-btn');

        if (this.votingActive && !this.isObserver) {
            cardsSection.style.display = 'block';
        } else {
            cardsSection.style.display = 'none';
        }

        // Update reveal button
        const allVoted = this.participants.filter(p => !p.isObserver).every(p => p.estimate);
        revealBtn.disabled = !this.votingActive || this.cardsRevealed || !allVoted;

        // Restore card selection
        if (this.selectedCard) {
            const card = document.querySelector(`[data-value="${this.selectedCard}"]`);
            if (card) {
                card.classList.add('selected');
            }
        }
    }

    updateResults() {
        const resultsDiv = document.getElementById('results');
        
        if (this.cardsRevealed && this.votingActive) {
            const estimates = this.participants
                .filter(p => !p.isObserver && p.estimate && p.estimate !== '?' && p.estimate !== 'coffee')
                .map(p => parseFloat(p.estimate))
                .filter(e => !isNaN(e));

            if (estimates.length > 0) {
                const average = (estimates.reduce((sum, val) => sum + val, 0) / estimates.length).toFixed(1);
                const mostCommon = this.getMostCommon(estimates);
                const consensus = this.getConsensus(estimates);

                document.getElementById('average').textContent = average;
                document.getElementById('most-common').textContent = mostCommon;
                document.getElementById('consensus').textContent = consensus;

                // Show vote breakdown
                this.updateVoteBreakdown();
            }

            resultsDiv.style.display = 'block';
        } else {
            resultsDiv.style.display = 'none';
        }
    }

    updateVoteBreakdown() {
        const breakdown = document.getElementById('votes-breakdown');
        const votes = {};

        this.participants.forEach(p => {
            if (!p.isObserver && p.estimate) {
                if (!votes[p.estimate]) {
                    votes[p.estimate] = [];
                }
                votes[p.estimate].push(p.name);
            }
        });

        let html = '<h3>Vote Distribution</h3>';
        Object.entries(votes).forEach(([value, participants]) => {
            html += `
                <div class="vote-item">
                    <span class="vote-value">${value}</span>
                    <span class="vote-participants">${participants.join(', ')}</span>
                </div>
            `;
        });

        breakdown.innerHTML = html;
    }

    updateShareLink() {
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
        document.getElementById('share-url').value = shareUrl;
        
        // Update session info
        document.getElementById('session-id').textContent = this.roomId;
        document.getElementById('voting-session-status').textContent = this.votingActive ? 'Active' : 'Inactive';
        document.getElementById('session-info').style.display = 'block';
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

    getConsensus(estimates) {
        const unique = [...new Set(estimates)];
        if (unique.length === 1) {
            return 'Perfect';
        } else if (unique.length <= 2) {
            return 'Good';
        } else if (unique.length <= 3) {
            return 'Fair';
        } else {
            return 'Poor';
        }
    }

    startSyncTimer() {
        // Sync with other users every 3 seconds
        setInterval(() => {
            this.syncWithOtherUsers();
        }, 3000);
    }

    syncWithOtherUsers() {
        const savedRoom = localStorage.getItem(`scrumPokerRoom_${this.roomId}`);
        if (savedRoom) {
            try {
                const roomData = JSON.parse(savedRoom);
                const currentTime = Date.now();
                
                // Only sync if data is newer than our last update
                if (roomData.lastUpdated > (this.lastSyncTime || 0)) {
                    this.lastSyncTime = roomData.lastUpdated;
                    
                    // Preserve current user's state
                    const currentUser = this.participants.find(p => p.isCurrentUser);
                    const currentUserData = currentUser ? {
                        name: currentUser.name,
                        estimate: currentUser.estimate,
                        isObserver: currentUser.isObserver
                    } : null;
                    
                    // Update room state
                    this.participants = roomData.participants || [];
                    this.currentStory = roomData.currentStory || '';
                    this.votingActive = roomData.votingActive || false;
                    this.cardsRevealed = roomData.cardsRevealed || false;
                    
                    // Restore current user state
                    if (currentUserData) {
                        const updatedUser = this.participants.find(p => p.name === currentUserData.name);
                        if (updatedUser) {
                            updatedUser.isCurrentUser = true;
                            this.selectedCard = updatedUser.estimate;
                            this.isObserver = updatedUser.isObserver;
                        }
                    }
                    
                    this.updateUI();
                }
            } catch (error) {
                // Ignore sync errors
            }
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ScrumPokerRoom();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        const revealBtn = document.getElementById('reveal-btn');
        if (!revealBtn.disabled) {
            revealBtn.click();
        }
    }
    
    const numberKeys = ['0', '1', '2', '3', '5', '8'];
    if (numberKeys.includes(e.key)) {
        const card = document.querySelector(`[data-value="${e.key}"]`);
        if (card) {
            card.click();
        }
    }
});
