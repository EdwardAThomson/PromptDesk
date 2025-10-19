document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const desktop = document.getElementById('desktop');
    const contextMenu = document.getElementById('context-menu');
    const menuSendToLLM = document.getElementById('menu-send-to-llm');
    const menuSendToGPT = document.getElementById('menu-send-to-gpt');
    const menuSendToClaude = document.getElementById('menu-send-to-claude');
    const menuSendToGemini = document.getElementById('menu-send-to-gemini');
    const menuRename = document.getElementById('menu-rename');
    const menuDelete = document.getElementById('menu-delete');
    const menuNewFile = document.getElementById('menu-new-file');
    const menuNewFolder = document.getElementById('menu-new-folder');
    
    // Modals
    const editModal = document.getElementById('edit-modal');
    const fileContent = document.getElementById('file-content');
    const modalTitle = document.getElementById('modal-title');
    const saveFileBtn = document.getElementById('save-file');
    const cancelEditBtn = document.getElementById('cancel-edit');
    
    const nameModal = document.getElementById('name-modal');
    const nameModalTitle = document.getElementById('name-modal-title');
    const itemName = document.getElementById('item-name');
    const itemTypeContainer = document.getElementById('item-type-container');
    const itemType = document.getElementById('item-type');
    const confirmNameBtn = document.getElementById('confirm-name');
    const cancelNameBtn = document.getElementById('cancel-name');
    
    // Chat window template
    const chatWindowTemplate = document.getElementById('chat-window-template');
    
    // API Config
    const apiConfigModal = document.getElementById('api-config-modal');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // API config inputs
    const openaiApiKey = document.getElementById('openai-api-key');
    const openaiModelSelect = document.getElementById('openai-model-select');
    const claudeApiKey = document.getElementById('claude-api-key');
    const claudeModelSelect = document.getElementById('claude-model-select');
    const geminiApiKey = document.getElementById('gemini-api-key');
    const geminiModelSelect = document.getElementById('gemini-model-select');
    
    const saveApiConfigBtn = document.getElementById('save-api-config');
    const cancelApiConfigBtn = document.getElementById('cancel-api-config');
    const configButton = document.getElementById('config-button');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // State variables
    let nextId = 1;
    let selectedItem = null;
    let activeFolder = null;
    let itemBeingDragged = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let currentOperation = null;
    let targetParent = null;
    let currentEditingFile = null;
    
    // API config state
    let apiConfig = {
        openai: {
            apiKey: '',
            model: 'gpt-5'
        },
        claude: {
            apiKey: '',
            model: 'claude-4.5-sonnet'
        },
        gemini: {
            apiKey: '',
            model: 'gemini-2.5-pro'
        },
        defaultProvider: 'openai'
    };

    // Load saved items from localStorage
    loadItems();
    loadApiConfig();

    // Initialize desktop
    function initialize() {
        // Listen for context menu on desktop
        desktop.addEventListener('contextmenu', handleDesktopContextMenu);
        
        // Hide context menu on click outside
        document.addEventListener('click', (e) => {
            contextMenu.classList.add('hidden');
        });
        
        // Context menu actions
        menuSendToLLM.addEventListener('click', () => handleSendToLLM('default'));
        menuSendToGPT.addEventListener('click', () => handleSendToLLM('openai'));
        menuSendToClaude.addEventListener('click', () => handleSendToLLM('claude'));
        menuSendToGemini.addEventListener('click', () => handleSendToLLM('gemini'));
        menuRename.addEventListener('click', handleRename);
        menuDelete.addEventListener('click', handleDelete);
        menuNewFile.addEventListener('click', handleNewFile);
        menuNewFolder.addEventListener('click', handleNewFolder);
        
        // Modal events
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', closeAllModals);
        });
        
        saveFileBtn.addEventListener('click', saveFileContent);
        cancelEditBtn.addEventListener('click', closeAllModals);
        
        confirmNameBtn.addEventListener('click', confirmNameAction);
        cancelNameBtn.addEventListener('click', closeAllModals);
        
        saveApiConfigBtn.addEventListener('click', saveApiConfiguration);
        cancelApiConfigBtn.addEventListener('click', closeAllModals);
        configButton.addEventListener('click', openApiConfigModal);
        
        // Dark mode toggle
        darkModeToggle.addEventListener('click', toggleDarkMode);
        loadDarkModePreference();
        
        // Tab switching in API config modal
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === editModal || e.target === nameModal || e.target === apiConfigModal) {
                closeAllModals();
            }
        });
        
        // Prevent default context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    // File and folder data structure functions
    function createFile(name, content = '', x = 20, y = 20, parent = null, fileType = 'file') {
        const id = `item-${nextId++}`;
        const file = {
            id,
            name,
            type: 'file',
            fileType, // 'file' or 'chat'
            content,
            position: { x, y },
            parent,
            chatHistory: fileType === 'chat' ? [] : undefined
        };
        
        saveItem(file);
        renderItem(file);
        return file;
    }

    function createFolder(name, x = 20, y = 20, parent = null) {
        const id = `item-${nextId++}`;
        const folder = {
            id,
            name,
            type: 'folder',
            items: [],
            position: { x, y },
            parent
        };
        
        saveItem(folder);
        renderItem(folder);
        return folder;
    }

    // Render functions
    function renderItem(item) {
        let container = desktop;
        
        if (item.parent) {
            const folderView = document.querySelector(`.folder-view[data-id="${item.parent}"]`);
            if (folderView) {
                container = folderView;
                // Reset position for items in folders
                if (container !== desktop) {
                    const existingItems = container.querySelectorAll('.desktop-item').length;
                    const cols = Math.floor(container.clientWidth / 100);
                    const row = Math.floor(existingItems / cols);
                    const col = existingItems % cols;
                    
                    item.position = {
                        x: 20 + col * 100,
                        y: 50 + row * 100
                    };
                }
            }
        }
        
        const itemElement = document.createElement('div');
        itemElement.className = 'desktop-item';
        itemElement.setAttribute('data-id', item.id);
        itemElement.setAttribute('data-type', item.type);
        
        if (item.fileType) {
            itemElement.setAttribute('data-file-type', item.fileType);
        }
        
        if (item.parent) {
            itemElement.setAttribute('data-parent', item.parent);
        }
        
        itemElement.style.left = `${item.position.x}px`;
        itemElement.style.top = `${item.position.y}px`;
        
        const iconElement = document.createElement('div');
        
        if (item.type === 'file') {
            if (item.fileType === 'chat') {
                iconElement.className = 'icon chat-icon';
                iconElement.innerHTML = '💬';
            } else {
                iconElement.className = 'icon file-icon';
                iconElement.innerHTML = '📄';
            }
        } else {
            iconElement.className = 'icon folder-icon';
            iconElement.innerHTML = '📁';
        }
        
        const nameElement = document.createElement('div');
        nameElement.className = 'item-name';
        nameElement.textContent = item.name;
        
        itemElement.appendChild(iconElement);
        itemElement.appendChild(nameElement);
        
        // Add event listeners
        itemElement.addEventListener('click', () => handleItemClick(item));
        itemElement.addEventListener('dblclick', () => handleItemDoubleClick(item));
        itemElement.addEventListener('contextmenu', (e) => handleItemContextMenu(e, item));
        
        // Add drag functionality
        itemElement.addEventListener('mousedown', (e) => handleMouseDown(e, item, itemElement));
        
        container.appendChild(itemElement);
        
        // Add creation animation
        itemElement.classList.add('file-creating');
        setTimeout(() => {
            itemElement.classList.remove('file-creating');
        }, 300);
    }

    function openFolder(folder) {
        // Check if folder is already open
        let folderView = document.querySelector(`.folder-view[data-id="${folder.id}"]`);
        
        if (!folderView) {
            folderView = document.createElement('div');
            folderView.className = 'folder-view';
            folderView.setAttribute('data-id', folder.id);
            
            // Position the folder view
            const folderElement = document.querySelector(`.desktop-item[data-id="${folder.id}"]`);
            const rect = folderElement.getBoundingClientRect();
            
            folderView.style.left = `${rect.left}px`;
            folderView.style.top = `${rect.top + 100}px`;
            folderView.style.width = '500px';
            folderView.style.height = '400px';
            
            // Add header with folder name and close button
            const header = document.createElement('div');
            header.className = 'folder-view-header';
            
            const folderTitle = document.createElement('div');
            folderTitle.textContent = folder.name;
            
            const closeButton = document.createElement('div');
            closeButton.className = 'close-folder';
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', () => {
                folderView.remove();
                activeFolder = null;
            });
            
            header.appendChild(folderTitle);
            header.appendChild(closeButton);
            folderView.appendChild(header);
            
            desktop.appendChild(folderView);
            
            // Add context menu for folder view
            folderView.addEventListener('contextmenu', (e) => {
                handleFolderViewContextMenu(e, folder);
            });
            
            // Make folder view draggable
            folderView.addEventListener('mousedown', (e) => {
                if (e.target === header || e.target === folderTitle) {
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startLeft = parseInt(folderView.style.left);
                    const startTop = parseInt(folderView.style.top);
                    
                    const handleMouseMove = (moveEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        const deltaY = moveEvent.clientY - startY;
                        
                        folderView.style.left = `${startLeft + deltaX}px`;
                        folderView.style.top = `${startTop + deltaY}px`;
                    };
                    
                    const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                }
            });
            
            // Render folder items
            renderFolderItems(folder);
            
            activeFolder = folder.id;
        }
    }

    function renderFolderItems(folder) {
        const folderItems = getFolderItems(folder.id);
        const folderView = document.querySelector(`.folder-view[data-id="${folder.id}"]`);
        
        if (folderView) {
            folderItems.forEach(item => {
                renderItem(item);
            });
        }
    }

    // Event handlers
    function handleMouseDown(e, item, element) {
        if (e.button !== 0) return; // Only left mouse button
        
        itemBeingDragged = item;
        element.classList.add('dragging');
        
        const rect = element.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        
        const handleMouseMove = (moveEvent) => {
            const x = moveEvent.clientX - dragOffsetX;
            const y = moveEvent.clientY - dragOffsetY;
            
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
            
            // If item is being dragged over a folder view
            const folderViews = document.querySelectorAll('.folder-view');
            let foundTarget = false;
            
            folderViews.forEach(folderView => {
                const folderRect = folderView.getBoundingClientRect();
                
                if (
                    moveEvent.clientX > folderRect.left && 
                    moveEvent.clientX < folderRect.right &&
                    moveEvent.clientY > folderRect.top && 
                    moveEvent.clientY < folderRect.bottom
                ) {
                    if (folderView.getAttribute('data-id') !== item.id) { // Prevent dropping folder into itself
                        targetParent = folderView.getAttribute('data-id');
                        foundTarget = true;
                    }
                }
            });
            
            if (!foundTarget) {
                targetParent = null;
            }
        };
        
        const handleMouseUp = () => {
            element.classList.remove('dragging');
            
            if (targetParent) {
                // Move item to new parent
                moveItemToFolder(item, targetParent);
                element.remove();
            } else {
                // Update position in current container
                item.position = {
                    x: parseInt(element.style.left),
                    y: parseInt(element.style.top)
                };
                saveItem(item);
            }
            
            itemBeingDragged = null;
            targetParent = null;
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    function handleItemClick(item) {
        // Deselect any previously selected item
        const prevSelected = document.querySelector('.desktop-item.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }
        
        // Select the current item
        const itemElement = document.querySelector(`.desktop-item[data-id="${item.id}"]`);
        if (itemElement) {
            itemElement.classList.add('selected');
            selectedItem = item;
        }
    }

    function handleItemDoubleClick(item) {
        if (item.type === 'folder') {
            openFolder(item);
        } else if (item.type === 'file') {
            if (item.fileType === 'chat') {
                openChatWindow(item);
            } else {
                openFileEditor(item);
            }
        }
    }
    
    function openChatWindow(chatItem) {
        // Check if chat window is already open
        let chatWindow = document.querySelector(`.chat-window[data-id="${chatItem.id}"]`);
        
        if (!chatWindow) {
            // Clone the template
            const template = chatWindowTemplate.querySelector('.chat-window').cloneNode(true);
            chatWindow = template;
            chatWindow.setAttribute('data-id', chatItem.id);
            
            // Set title
            const chatTitle = chatWindow.querySelector('.chat-title');
            chatTitle.textContent = chatItem.name;
            
            // Position the chat window
            const chatElement = document.querySelector(`.desktop-item[data-id="${chatItem.id}"]`);
            const rect = chatElement.getBoundingClientRect();
            
            chatWindow.style.left = `${rect.left}px`;
            chatWindow.style.top = `${rect.top + 100}px`;
            
            // Setup event listeners
            const closeButton = chatWindow.querySelector('.chat-close');
            closeButton.addEventListener('click', () => {
                chatWindow.remove();
            });
            
            const minimizeButton = chatWindow.querySelector('.chat-minimize');
            minimizeButton.addEventListener('click', () => {
                if (chatWindow.style.height === '40px') {
                    chatWindow.style.height = chatWindow.getAttribute('data-prev-height') || '500px';
                } else {
                    chatWindow.setAttribute('data-prev-height', chatWindow.style.height || '500px');
                    chatWindow.style.height = '40px';
                }
            });
            
            // Make chat window draggable
            const header = chatWindow.querySelector('.chat-header');
            header.addEventListener('mousedown', (e) => {
                const startX = e.clientX;
                const startY = e.clientY;
                const startLeft = parseInt(chatWindow.style.left) || rect.left;
                const startTop = parseInt(chatWindow.style.top) || (rect.top + 100);
                
                const handleMouseMove = (moveEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const deltaY = moveEvent.clientY - startY;
                    
                    chatWindow.style.left = `${startLeft + deltaX}px`;
                    chatWindow.style.top = `${startTop + deltaY}px`;
                };
                
                const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            });
            
            // Add event listener for the send button
            const sendButton = chatWindow.querySelector('.chat-send');
            const chatInput = chatWindow.querySelector('.chat-input');
            const chatMessages = chatWindow.querySelector('.chat-messages');
            const modelSelect = chatWindow.querySelector('.chat-model-select');
            
            sendButton.addEventListener('click', () => {
                const message = chatInput.value.trim();
                if (!message) return;
                
                // Add user message to the chat
                addMessageToChat(chatItem, chatMessages, message, 'user');
                chatInput.value = '';
                
                // Get selected model
                const provider = modelSelect.value === 'default' ? apiConfig.defaultProvider : modelSelect.value;
                
                // Check if API key is configured
                if (!apiConfig[provider].apiKey) {
                    alert(`Please configure your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key first.`);
                    openApiConfigModal();
                    return;
                }
                
                // Show loading indicator inside chat
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'chat-message assistant-message loading';
                loadingDiv.innerHTML = 'Thinking...';
                chatMessages.appendChild(loadingDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // Send to LLM
                sendPromptToLLM(message, provider, chatItem.chatHistory)
                    .then(response => {
                        // Remove loading indicator
                        chatMessages.removeChild(loadingDiv);
                        
                        // Add assistant message to the chat
                        addMessageToChat(chatItem, chatMessages, response, 'assistant');
                    })
                    .catch(error => {
                        // Remove loading indicator
                        chatMessages.removeChild(loadingDiv);
                        
                        // Show error
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'chat-message error-message';
                        errorDiv.textContent = `Error: ${error.message}`;
                        chatMessages.appendChild(errorDiv);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    });
            });
            
            // Add enter key support for sending
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendButton.click();
                }
            });
            
            // Load previous chat history
            if (chatItem.chatHistory && chatItem.chatHistory.length > 0) {
                chatItem.chatHistory.forEach(msg => {
                    addMessageToChat(chatItem, chatMessages, msg.content, msg.role, false);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            desktop.appendChild(chatWindow);
        }
    }
    
    function addMessageToChat(chatItem, chatMessagesElement, message, role, saveToHistory = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}-message`;
        messageDiv.textContent = message;
        
        chatMessagesElement.appendChild(messageDiv);
        chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
        
        // Save to history
        if (saveToHistory) {
            if (!chatItem.chatHistory) {
                chatItem.chatHistory = [];
            }
            
            chatItem.chatHistory.push({
                role,
                content: message
            });
            
            saveItem(chatItem);
        }
    }

    function handleDesktopContextMenu(e) {
        // Only show context menu on desktop, not on items
        if (e.target === desktop || e.target.id === 'desktop') {
            selectedItem = null;
            showContextMenu(e, false);
        }
    }

    function handleItemContextMenu(e, item) {
        selectedItem = item;
        showContextMenu(e, true, item.type === 'file');
        e.stopPropagation();
    }

    function handleFolderViewContextMenu(e, folder) {
        if (e.target.classList.contains('folder-view') || e.target.classList.contains('folder-view-header')) {
            selectedItem = folder;
            showContextMenu(e, false);
            e.stopPropagation();
        }
    }

    function showContextMenu(e, isItem, isFile = false) {
        e.preventDefault();
        
        // Position context menu
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        
        // Show/hide menu items based on context
        menuSendToLLM.style.display = isFile ? 'block' : 'none';
        menuSendToGPT.style.display = isFile ? 'block' : 'none';
        menuSendToClaude.style.display = isFile ? 'block' : 'none';
        menuSendToGemini.style.display = isFile ? 'block' : 'none';
        menuRename.style.display = isItem ? 'block' : 'none';
        menuDelete.style.display = isItem ? 'block' : 'none';
        
        // Show menu
        contextMenu.classList.remove('hidden');
    }

    function handleSendToLLM(provider) {
        if (selectedItem && selectedItem.type === 'file') {
            // Use the default provider if not specified
            const providerToUse = provider === 'default' ? apiConfig.defaultProvider : provider;
            
            // Check if API key is configured
            if (!apiConfig[providerToUse].apiKey) {
                alert(`Please configure your ${providerToUse.charAt(0).toUpperCase() + providerToUse.slice(1)} API key first.`);
                openApiConfigModal();
                return;
            }
            
            // Show loading overlay
            const loadingOverlay = document.getElementById('loading-overlay');
            loadingOverlay.classList.remove('hidden');
            
            // Set loading text based on provider
            const loadingText = loadingOverlay.querySelector('.loading-text');
            const providerName = providerToUse.charAt(0).toUpperCase() + providerToUse.slice(1);
            loadingText.textContent = `Getting response from ${providerName}...`;
            
            // Send to LLM
            sendPromptToLLM(selectedItem.content, providerToUse)
                .then(response => {
                    const timestamp = new Date().toISOString().replace(/[-:]/g, '').substring(0, 15);
                    const responseName = `${selectedItem.name.split('.')[0]}_${providerToUse}_response_${timestamp}.txt`;
                    
                    // Create new file with response
                    const parentId = selectedItem.parent;
                    const x = selectedItem.position.x + 100;
                    const y = selectedItem.position.y;
                    
                    createFile(responseName, response, x, y, parentId);
                })
                .catch(error => {
                    alert(`Error: ${error.message}`);
                })
                .finally(() => {
                    // Hide loading overlay
                    loadingOverlay.classList.add('hidden');
                });
        }
        
        contextMenu.classList.add('hidden');
    }

    function handleRename() {
        if (selectedItem) {
            currentOperation = 'rename';
            nameModalTitle.textContent = `Rename ${selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}`;
            itemName.value = selectedItem.name;
            nameModal.classList.remove('hidden');
        }
        
        contextMenu.classList.add('hidden');
    }

    function handleDelete() {
        if (selectedItem) {
            deleteItem(selectedItem);
        }
        
        contextMenu.classList.add('hidden');
    }

    function handleNewFile() {
        currentOperation = 'newFile';
        nameModalTitle.textContent = 'Create New File';
        itemName.value = '';
        
        // Show file type selection
        itemTypeContainer.classList.remove('hidden');
        itemType.value = 'file';
        
        nameModal.classList.remove('hidden');
        
        contextMenu.classList.add('hidden');
    }

    function handleNewFolder() {
        currentOperation = 'newFolder';
        nameModalTitle.textContent = 'Create New Folder';
        itemName.value = '';
        
        // Hide file type selection for folder creation
        itemTypeContainer.classList.add('hidden');
        
        nameModal.classList.remove('hidden');
        
        contextMenu.classList.add('hidden');
    }

    function confirmNameAction() {
        const name = itemName.value.trim();
        
        if (!name) {
            alert('Please enter a name.');
            return;
        }
        
        switch (currentOperation) {
            case 'rename':
                if (selectedItem) {
                    selectedItem.name = name;
                    saveItem(selectedItem);
                    
                    const itemElement = document.querySelector(`.desktop-item[data-id="${selectedItem.id}"]`);
                    if (itemElement) {
                        const nameElement = itemElement.querySelector('.item-name');
                        nameElement.textContent = name;
                    }
                    
                    if (selectedItem.type === 'folder') {
                        const folderView = document.querySelector(`.folder-view[data-id="${selectedItem.id}"]`);
                        if (folderView) {
                            const folderTitle = folderView.querySelector('.folder-view-header div:first-child');
                            folderTitle.textContent = name;
                        }
                    }
                }
                break;
                
            case 'newFile':
                const parentId = activeFolder;
                let x = 20, y = 20;
                
                if (parentId) {
                    // Position in folder view
                    const folderView = document.querySelector(`.folder-view[data-id="${parentId}"]`);
                    const existingItems = folderView.querySelectorAll('.desktop-item').length;
                    const cols = Math.floor(folderView.clientWidth / 100);
                    const row = Math.floor(existingItems / cols);
                    const col = existingItems % cols;
                    
                    x = 20 + col * 100;
                    y = 50 + row * 100;
                } else {
                    // Position on desktop
                    const rect = contextMenu.getBoundingClientRect();
                    x = rect.left;
                    y = rect.top;
                }
                
                const selectedFileType = itemType.value;
                createFile(name, '', x, y, parentId, selectedFileType);
                
                // If it's a chat file, open it immediately
                if (selectedFileType === 'chat') {
                    // Find the item we just created
                    setTimeout(() => {
                        const items = JSON.parse(localStorage.getItem('desktop_items') || '[]');
                        const chatItem = items.find(i => i.name === name && i.fileType === 'chat');
                        if (chatItem) {
                            openChatWindow(chatItem);
                        }
                    }, 100);
                }
                break;
                
            case 'newFolder':
                const parentFolderId = activeFolder;
                let folderX = 20, folderY = 20;
                
                if (parentFolderId) {
                    // Position in folder view
                    const folderView = document.querySelector(`.folder-view[data-id="${parentFolderId}"]`);
                    const existingItems = folderView.querySelectorAll('.desktop-item').length;
                    const cols = Math.floor(folderView.clientWidth / 100);
                    const row = Math.floor(existingItems / cols);
                    const col = existingItems % cols;
                    
                    folderX = 20 + col * 100;
                    folderY = 50 + row * 100;
                } else {
                    // Position on desktop
                    const rect = contextMenu.getBoundingClientRect();
                    folderX = rect.left;
                    folderY = rect.top;
                }
                
                createFolder(name, folderX, folderY, parentFolderId);
                break;
        }
        
        closeAllModals();
    }

    function openFileEditor(file) {
        modalTitle.textContent = `Edit: ${file.name}`;
        fileContent.value = file.content;
        currentEditingFile = file;
        editModal.classList.remove('hidden');
    }

    function saveFileContent() {
        if (currentEditingFile) {
            currentEditingFile.content = fileContent.value;
            saveItem(currentEditingFile);
        }
        
        closeAllModals();
    }

    function openApiConfigModal() {
        // Set values from config
        openaiApiKey.value = apiConfig.openai.apiKey;
        openaiModelSelect.value = apiConfig.openai.model;
        claudeApiKey.value = apiConfig.claude.apiKey;
        claudeModelSelect.value = apiConfig.claude.model;
        geminiApiKey.value = apiConfig.gemini.apiKey;
        geminiModelSelect.value = apiConfig.gemini.model;
        
        // Set active tab based on default provider
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        const activeTab = document.querySelector(`.tab-button[data-tab="${apiConfig.defaultProvider}"]`);
        if (activeTab) activeTab.classList.add('active');
        
        const activeContent = document.getElementById(`${apiConfig.defaultProvider}-tab`);
        if (activeContent) activeContent.classList.add('active');
        
        apiConfigModal.classList.remove('hidden');
    }

    function saveApiConfiguration() {
        // Save values to config
        apiConfig.openai.apiKey = openaiApiKey.value;
        apiConfig.openai.model = openaiModelSelect.value;
        apiConfig.claude.apiKey = claudeApiKey.value;
        apiConfig.claude.model = claudeModelSelect.value;
        apiConfig.gemini.apiKey = geminiApiKey.value;
        apiConfig.gemini.model = geminiModelSelect.value;
        
        // Set default provider based on active tab
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab) {
            apiConfig.defaultProvider = activeTab.getAttribute('data-tab');
        }
        
        // Save to localStorage
        localStorage.setItem('llm_api_config', JSON.stringify(apiConfig));
        
        closeAllModals();
    }

    function closeAllModals() {
        editModal.classList.add('hidden');
        nameModal.classList.add('hidden');
        apiConfigModal.classList.add('hidden');
        currentEditingFile = null;
        currentOperation = null;
    }

    // Data persistence functions
    function saveItem(item) {
        let items = JSON.parse(localStorage.getItem('desktop_items') || '[]');
        
        // Check if item already exists
        const index = items.findIndex(i => i.id === item.id);
        
        if (index !== -1) {
            items[index] = item;
        } else {
            items.push(item);
        }
        
        localStorage.setItem('desktop_items', JSON.stringify(items));
        
        // Update nextId
        const maxId = Math.max(...items.map(i => parseInt(i.id.split('-')[1])), 0);
        nextId = maxId + 1;
    }

    function deleteItem(item) {
        let items = JSON.parse(localStorage.getItem('desktop_items') || '[]');
        
        // If it's a folder, delete all children
        if (item.type === 'folder') {
            items = items.filter(i => i.parent !== item.id);
            
            // Close folder view if open
            const folderView = document.querySelector(`.folder-view[data-id="${item.id}"]`);
            if (folderView) {
                folderView.remove();
            }
        }
        
        // Remove the item itself
        items = items.filter(i => i.id !== item.id);
        localStorage.setItem('desktop_items', JSON.stringify(items));
        
        // Remove from DOM
        const itemElement = document.querySelector(`.desktop-item[data-id="${item.id}"]`);
        if (itemElement) {
            itemElement.remove();
        }
    }

    function moveItemToFolder(item, folderId) {
        item.parent = folderId;
        saveItem(item);
        
        // Re-render item in the new folder
        renderItem(item);
    }

    function loadItems() {
        const items = JSON.parse(localStorage.getItem('desktop_items') || '[]');
        
        // Get the highest id to set nextId
        if (items.length > 0) {
            const maxId = Math.max(...items.map(i => parseInt(i.id.split('-')[1])), 0);
            nextId = maxId + 1;
        }
        
        // First render items without parents (on desktop)
        items.filter(item => !item.parent).forEach(item => {
            renderItem(item);
        });
    }

    function loadApiConfig() {
        const savedConfig = localStorage.getItem('llm_api_config');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                
                // Handle migration from old format
                if (parsed.apiKey !== undefined) {
                    // Old format
                    apiConfig = {
                        openai: {
                            apiKey: parsed.apiKey || '',
                            model: parsed.model || 'gpt-4o'
                        },
                        claude: {
                            apiKey: '',
                            model: 'claude-3.5-sonnet-20240229'
                        },
                        gemini: {
                            apiKey: '',
                            model: 'gemini-1.5-pro'
                        },
                        defaultProvider: 'openai'
                    };
                } else {
                    // New format
                    apiConfig = parsed;
                }
            } catch (e) {
                console.error('Error parsing saved API config:', e);
            }
        }
    }

    function getFolderItems(folderId) {
        const items = JSON.parse(localStorage.getItem('desktop_items') || '[]');
        return items.filter(item => item.parent === folderId);
    }

    // LLM integration
    async function sendPromptToLLM(prompt, provider, chatHistory = []) {
        try {
            let response, data;
            
            switch (provider) {
                case 'openai':
                    // Build messages array from chat history
                    const openaiMessages = [
                        { role: 'system', content: 'You are a helpful assistant.' }
                    ];
                    
                    // Add chat history
                    if (chatHistory && chatHistory.length > 0) {
                        chatHistory.forEach(msg => {
                            openaiMessages.push({
                                role: msg.role === 'assistant' ? 'assistant' : 'user',
                                content: msg.content
                            });
                        });
                    } else {
                        // If no history, just add the current prompt
                        openaiMessages.push({ role: 'user', content: prompt });
                    }
                    
                    // If we added history but not the current prompt
                    if (chatHistory && chatHistory.length > 0 && 
                        (chatHistory[chatHistory.length - 1].content !== prompt || 
                         chatHistory[chatHistory.length - 1].role !== 'user')) {
                        openaiMessages.push({ role: 'user', content: prompt });
                    }
                    
                    response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiConfig.openai.apiKey}`
                        },
                        body: JSON.stringify({
                            model: apiConfig.openai.model,
                            messages: openaiMessages,
                            temperature: 0.7
                        })
                    });
                    
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error?.message || 'Failed to get response from OpenAI');
                    }
                    
                    data = await response.json();
                    return data.choices[0].message.content;
                
                case 'claude':
                    // Build messages array from chat history
                    const claudeMessages = [];
                    
                    // Add chat history
                    if (chatHistory && chatHistory.length > 0) {
                        chatHistory.forEach(msg => {
                            claudeMessages.push({
                                role: msg.role === 'assistant' ? 'assistant' : 'user',
                                content: msg.content
                            });
                        });
                    }
                    
                    // If we added history but not the current prompt
                    if (chatHistory && chatHistory.length > 0 && 
                        (chatHistory[chatHistory.length - 1].content !== prompt || 
                         chatHistory[chatHistory.length - 1].role !== 'user')) {
                        claudeMessages.push({ role: 'user', content: prompt });
                    } else if (!chatHistory || chatHistory.length === 0) {
                        // If no history, just add the current prompt
                        claudeMessages.push({ role: 'user', content: prompt });
                    }
                    
                    response = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': apiConfig.claude.apiKey,
                            'anthropic-version': '2023-06-01'
                        },
                        body: JSON.stringify({
                            model: apiConfig.claude.model,
                            messages: claudeMessages,
                            max_tokens: 4000
                        })
                    });
                    
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error?.message || 'Failed to get response from Claude');
                    }
                    
                    data = await response.json();
                    return data.content[0].text;
                
                case 'gemini':
                    // Build contents array for Gemini
                    const geminiContents = [];
                    
                    // Add chat history
                    if (chatHistory && chatHistory.length > 0) {
                        chatHistory.forEach(msg => {
                            geminiContents.push({
                                role: msg.role === 'assistant' ? 'model' : 'user',
                                parts: [{ text: msg.content }]
                            });
                        });
                    }
                    
                    // If we added history but not the current prompt
                    if (chatHistory && chatHistory.length > 0 && 
                        (chatHistory[chatHistory.length - 1].content !== prompt || 
                         chatHistory[chatHistory.length - 1].role !== 'user')) {
                        geminiContents.push({ 
                            role: 'user',
                            parts: [{ text: prompt }]
                        });
                    } else if (!chatHistory || chatHistory.length === 0) {
                        // If no history, just add the current prompt
                        geminiContents.push({ 
                            role: 'user',
                            parts: [{ text: prompt }]
                        });
                    }
                    
                    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiConfig.gemini.model}:generateContent?key=${apiConfig.gemini.apiKey}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: geminiContents
                        })
                    });
                    
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error?.message || 'Failed to get response from Gemini');
                    }
                    
                    data = await response.json();
                    return data.candidates[0].content.parts[0].text;
            }
        } catch (error) {
            console.error(`Error sending prompt to ${provider}:`, error);
            throw error;
        }
    }

    // Dark mode functions
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        // Update button icon
        darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
        
        // Save preference
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    }
    
    function loadDarkModePreference() {
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️';
        }
    }

    // Initialize the app
    initialize();
});