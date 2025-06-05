document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const addItemBtnDetail = document.getElementById('add-item-btn-detail');
    const habitList = document.getElementById('habit-list');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const achievementDisplayTypeSelect = document.getElementById('achievement-display-type');
    const sortBySelect = document.getElementById('sort-by');
    const habitCountDisplay = document.getElementById('habit-count');
    const messageArea = document.getElementById('message-area');

    // 詳細入力用DOM要素
    const itemCategoryInput = document.getElementById('item-category');
    const itemPeriodInput = document.getElementById('item-period');
    const itemFrequencyInput = document.getElementById('item-frequency');
    const itemContentInput = document.getElementById('item-content');
    const itemTriggerInput = document.getElementById('item-trigger');
    const itemStartTimingInput = document.getElementById('item-start-timing');
    const frequencyHint = document.getElementById('frequency-hint');
    const startTimingHint = document.getElementById('start-timing-hint');

    // カスタム確認モーダル DOM要素
    const confirmModal = document.getElementById('custom-confirm-modal');
    const confirmMessage = document.getElementById('custom-confirm-message');
    const confirmYesBtn = document.getElementById('custom-confirm-yes');
    const confirmNoBtn = document.getElementById('custom-confirm-no');
    let confirmCallback = null;

    // モーダル要素の存在チェックと初期化
    if (!confirmModal || !confirmMessage || !confirmYesBtn || !confirmNoBtn) {
        console.error("CRITICAL: カスタム確認モーダルの構成要素の一部が見つかりません。HTMLのIDを確認してください。");
        if(messageArea) showMessage("エラー: アプリケーションの初期化に失敗しました (モーダル要素不足)。", "error", 0);
        if (deleteAllBtn) deleteAllBtn.disabled = true;
        // モーダルがなければ、依存する機能は使えない
    } else {
        // モーダルボタンのイベントリスナーは一度だけ設定
        confirmYesBtn.addEventListener('click', () => {
            console.log("Confirm Yes button clicked."); 
            if (typeof confirmCallback === 'function') {
                console.log("Executing confirmCallback..."); 
                confirmCallback();
            } else {
                console.warn("confirmCallback is not a function or not set."); 
            }
            hideCustomConfirm();
        });

        confirmNoBtn.addEventListener('click', () => {
            // console.log("Confirm No clicked.");
            hideCustomConfirm();
        });
        // console.log("Modal event listeners set up."); 
    }


    let habits = []; 
    
    function loadHabits() {
        try {
            const storedHabits = localStorage.getItem('habits');
            habits = storedHabits ? JSON.parse(storedHabits) : [];
            // console.log("Habits loaded from localStorage:", JSON.parse(JSON.stringify(habits)));
        } catch(e) {
            console.error("ローカルストレージからの習慣データの読み込みに失敗しました:", e);
            habits = []; 
            if(messageArea) showMessage("保存された習慣データの読み込みに失敗しました。", "error");
        }
    }


    const MAX_HABITS = 100;
    const PERIOD_SETTINGS = {
        dayly: { freqDefault: 1, freqMin: 1, freqMax: 24, startHint: "HH:MM (例: 07:00)", startDefault: "00:00" },
        weekly: { freqDefault: 5, freqMin: 1, freqMax: 14, startHint: "曜日 (monday, ..., sunday)", startDefault: "monday" },
        'bi-weekly': { freqDefault: 1, freqMin: 1, freqMax: 24, startHint: "曜日 (monday, ..., sunday)", startDefault: "monday" },
        monthly: { freqDefault: 1, freqMin: 1, freqMax: 24, startHint: "日 (1-31)", startDefault: "1" },
        Quaterly: { freqDefault: 1, freqMin: 1, freqMax: 24, startHint: "開始月 (1-12)", startDefault: "1" },
        Yearly: { freqDefault: 1, freqMin: 1, freqMax: 24, startHint: "開始月 (1-12)", startDefault: "1" }
    };
    const PERIOD_ORDER = { "dayly": 1, "weekly": 2, "bi-weekly": 3, "monthly": 4, "Quaterly": 5, "Yearly": 6 };

    function showMessage(message, type = 'info', duration = 3500) {
        if (!messageArea) return; 
        messageArea.textContent = message;
        messageArea.className = 'message-area';
        messageArea.classList.add(`message-${type}`);
        messageArea.style.display = 'block';
        if (duration > 0) {
            setTimeout(() => {
                if (messageArea.textContent === message) {
                    messageArea.style.display = 'none';
                    messageArea.textContent = '';
                    messageArea.className = 'message-area';
                }
            }, duration);
        }
    }

    function showCustomConfirm(message, callback) {
        console.log("Attempting to show custom confirm. Message:", message); 
        if (!confirmModal || !confirmMessage) { 
            console.error("showCustomConfirm: モーダル表示に必要な要素 (confirmModal or confirmMessage) が見つかりません。");
            showMessage("エラー: 確認ダイアログを表示できません (要素不足)。", "error");
            if (typeof callback === 'function') {
                console.warn("確認モーダルが表示できないため、コールバックは実行されませんでした。");
            }
            return;
        }
        
        confirmMessage.textContent = message;
        confirmCallback = callback; 
        confirmModal.classList.add('active');
        console.log("confirmModal.classList.contains('active') after add:", confirmModal.classList.contains('active')); // ★新しいデバッグログ
        console.log("Custom confirm modal should be active now. Callback set."); 
    }

    function hideCustomConfirm() {
        // console.log("hideCustomConfirm called");
        if (confirmModal) {
            confirmModal.classList.remove('active');
            // console.log("confirmModal.classList.contains('active') after remove:", confirmModal.classList.contains('active')); // ★オプション: 削除確認ログ
        }
        confirmCallback = null; 
    }

    function saveHabits() {
        try {
            localStorage.setItem('habits', JSON.stringify(habits));
            // console.log("Habits saved to localStorage:", JSON.parse(JSON.stringify(habits)));
        } catch (e) {
            console.error("ローカルストレージへの保存に失敗しました:", e);
            showMessage("データの保存に失敗しました。ストレージ容量を確認してください。", "error", 0);
        }
    }

    function updateHints() {
        if (!itemPeriodInput || !frequencyHint || !itemFrequencyInput || !startTimingHint || !itemStartTimingInput) return;
        const selectedPeriod = itemPeriodInput.value;
        const settings = PERIOD_SETTINGS[selectedPeriod];
        if (settings) {
            frequencyHint.textContent = `推奨: ${settings.freqDefault}, 範囲: ${settings.freqMin}-${settings.freqMax}`;
            const currentFreq = parseInt(itemFrequencyInput.value, 10);
            if (isNaN(currentFreq) || currentFreq > settings.freqMax || currentFreq < settings.freqMin) {
                 itemFrequencyInput.value = settings.freqDefault;
            }
            itemFrequencyInput.min = settings.freqMin;
            itemFrequencyInput.max = settings.freqMax;
            startTimingHint.textContent = `例: ${settings.startHint}`;
            if (!itemStartTimingInput.value) {
                itemStartTimingInput.placeholder = `デフォルト: ${settings.startDefault}`;
            }
        }
    }

    function addHabit() {
        if (habits.length >= MAX_HABITS) {
            showMessage(`登録できる習慣は${MAX_HABITS}項目までです。`, 'error');
            return;
        }
        const category = itemCategoryInput.value;
        const period = itemPeriodInput.value;
        const frequency = parseInt(itemFrequencyInput.value, 10);
        const content = itemContentInput.value.trim();
        const trigger = itemTriggerInput.value.trim();
        let startTiming = itemStartTimingInput.value.trim();

        if (!content) {
            showMessage("「内容」を入力してください。", 'error');
            return;
        }
        const settings = PERIOD_SETTINGS[period];
        if (isNaN(frequency) || frequency < settings.freqMin || frequency > settings.freqMax) {
            showMessage(`無効な回数です: 「${itemFrequencyInput.value}」。周期「${period}」の場合、${settings.freqMin}～${settings.freqMax}の範囲で入力してください。`, 'error', 5000);
            return;
        }
        if (!startTiming) startTiming = settings.startDefault;

        const newHabit = {
            id: Date.now(), 
            category, period, frequency, content, trigger, startTiming,
            checkedCount: 0, isHabituated: false, createdAt: new Date().toISOString()
        };
        clearDetailInputs();
        habits.push(newHabit);
        saveHabits();
        renderHabits();
        showMessage('新しい習慣を登録しました！', 'success');
    }
    
    function clearDetailInputs() {
        if (!itemCategoryInput || !itemPeriodInput || !itemContentInput || !itemTriggerInput || !itemStartTimingInput || !itemFrequencyInput) return;
        itemCategoryInput.value = "Mindfulness";
        itemPeriodInput.value = "dayly";
        itemContentInput.value = "";
        itemTriggerInput.value = "";
        itemStartTimingInput.value = "";
        updateHints(); 
    }

    function deleteHabit(idToDelete) {
        // console.log(`Attempting to delete habit. ID from dataset (string): '${idToDelete}'`);
        showCustomConfirm("この習慣を本当に削除しますか？", () => {
            // console.log(`Confirmation received for deleting ID: '${idToDelete}'`);
            const initialLength = habits.length;
            const targetIdNumeric = Number(idToDelete); 

            if (isNaN(targetIdNumeric)) {
                // console.error("Error: ID to delete is NaN after conversion:", idToDelete);
                showMessage('削除処理中にエラーが発生しました (IDが不正です)。', 'error');
                return;
            }
            
            habits = habits.filter(habit => {
                const currentHabitIdNumeric = Number(habit.id);
                return currentHabitIdNumeric !== targetIdNumeric;
            });

            if (habits.length < initialLength) {
                saveHabits(); 
                renderHabits(); 
                showMessage('習慣を削除しました。', 'info');
            } else {
                showMessage('削除対象の習慣が見つかりませんでした。ページを再読み込みして再度お試しください。', 'error', 5000);
            }
        });
    }

    function deleteAllHabits() {
        console.log("deleteAllHabits function called."); 
        if (habits.length === 0) {
            console.log("No habits to delete."); 
            showMessage("削除する習慣がありません。", 'info');
            return;
        }
        if (!confirmModal) { 
            console.error("deleteAllHabits: confirmModal is null. Cannot show confirmation.");
            showMessage("エラー: 確認ダイアログの表示に失敗しました (モーダル要素なし)。", "error");
            return;
        }
        console.log("Proceeding to showCustomConfirm for deleteAllHabits."); 

        showCustomConfirm("すべての習慣項目を本当に削除しますか？この操作は元に戻せません。", () => {
            console.log("deleteAllHabits confirmation callback executed."); 
            habits = []; 
            try {
                localStorage.removeItem('habits'); 
                console.log("localStorage 'habits' key removed successfully."); 
            } catch (e) {
                console.error("ローカルストレージからの削除に失敗しました:", e);
                showMessage("データの完全削除に失敗しました。手動でのクリアが必要な場合があります。", "error", 0);
            }
            renderHabits(); 
            showMessage('すべての習慣を削除しました。', 'info');
        });
    }

    function toggleHabituated(idToToggle) {
        const targetIdNumeric = Number(idToToggle);
        const habit = habits.find(h => Number(h.id) === targetIdNumeric);
        if (habit) {
            habit.isHabituated = !habit.isHabituated;
            saveHabits();
            renderHabits();
            showMessage(habit.isHabituated ? '習慣化達成済みにしました。' : '習慣化設定を未達成に戻しました。', 'info');
        }
    }

    function handleProgressCheck(habitIdToCheck, checkboxElement) {
        const targetIdNumeric = Number(habitIdToCheck);
        const habit = habits.find(h => Number(h.id) === targetIdNumeric);
        if (habit && !habit.isHabituated) {
            const checkboxesInItem = Array.from(checkboxElement.closest('.actions').querySelectorAll('.progress-checkbox'));
            habit.checkedCount = checkboxesInItem.filter(cb => cb.checked).length;
            saveHabits();
            renderHabits();
        }
    }

    function getAchievementDisplay(habit) {
        const type = achievementDisplayTypeSelect.value;
        const progress = habit.isHabituated ? 1 : (habit.frequency > 0 ? (habit.checkedCount / habit.frequency) : 0);
        const percentage = Math.round(progress * 100);
        switch (type) {
            case 'percentage': return `${percentage}%`;
            case 'signal':
                let colorClass = 'signal-red';
                if (percentage === 100) colorClass = 'signal-green';
                else if (percentage >= 71) colorClass = 'signal-blue';
                else if (percentage >= 31) colorClass = 'signal-yellow';
                return `<span class="signal-display ${colorClass}" title="${percentage}%"></span>`;
            default: return `${habit.checkedCount}/${habit.frequency}`;
        }
    }

    function renderHabits() {
        if(!habitList || !habitCountDisplay) return;
        // console.log("renderHabits called. Current habits count:", habits.length);
        // console.log("Habits data for rendering:", JSON.parse(JSON.stringify(habits)));
        habitList.innerHTML = '';
        habitCountDisplay.textContent = habits.length;
        if (habits.length === 0) {
            habitList.innerHTML = '<li>登録されている習慣はありません。新しい習慣を登録しましょう！</li>';
            return;
        }
        const sortedHabits = sortHabits([...habits]);
        const nonHabituatedItems = sortedHabits.filter(h => !h.isHabituated);
        const habituatedItems = sortedHabits.filter(h => h.isHabituated);
        const displayList = [...nonHabituatedItems, ...habituatedItems];

        displayList.forEach(habit => {
            const listItem = document.createElement('li');
            listItem.classList.add('habit-item');
            listItem.dataset.id = habit.id; 
            if (habit.isHabituated) listItem.classList.add('completed-habit');
            const achievementHtml = getAchievementDisplay(habit);
            const mark = habit.isHabituated ? '🌸' : '○';
            let progressCheckboxesHtml = '';
            if (!habit.isHabituated) {
                progressCheckboxesHtml += `<span class="progress-checkbox-container">達成: `;
                for (let i = 1; i <= habit.frequency; i++) {
                    progressCheckboxesHtml += `<input type="checkbox" class="progress-checkbox" data-habit-id="${habit.id}" ${i <= habit.checkedCount ? 'checked' : ''} aria-label="進捗${i}">`;
                }
                progressCheckboxesHtml += `</span>`;
            } else {
                progressCheckboxesHtml = '<span style="font-style: italic; color: #27ae60;">習慣化達成済み！</span>';
            }
            listItem.innerHTML = `
                <div class="item-header">
                    <div class="item-header-main">
                        <span class="item-mark" aria-hidden="true">${mark}</span>
                        <div>
                            <span class="item-category-display">${habit.category}</span>
                            <span class="item-content-display">${habit.content}</span>
                        </div>
                    </div>
                    <div class="achievement-display" aria-label="達成度">${achievementHtml}</div>
                </div>
                <div class="item-details">
                    <p><strong>周期:</strong> ${habit.period} (目標: ${habit.frequency}回)</p>
                    <p><strong>きっかけ:</strong> ${habit.trigger || '未設定'}</p>
                    <p><strong>開始タイミング:</strong> ${habit.startTiming || '未設定'}</p>
                </div>
                <div class="actions">
                    ${progressCheckboxesHtml}
                    <label class="mark-habituated-label">
                        <input type="checkbox" class="mark-habituated-checkbox" data-habit-id="${habit.id}" ${habit.isHabituated ? 'checked' : ''}>
                        習慣化達成とする
                    </label>
                    <button class="btn btn-warning delete-item-btn" data-id="${habit.id}">この習慣を削除</button>
                </div>`;
            habitList.appendChild(listItem);
        });
        addEventListenersToItems();
    }

    function addEventListenersToItems() {
        document.querySelectorAll('.delete-item-btn').forEach(button => {
            button.removeEventListener('click', handleDeleteButtonClick); 
            button.addEventListener('click', handleDeleteButtonClick);
        });
        document.querySelectorAll('.mark-habituated-checkbox').forEach(checkbox => {
            checkbox.removeEventListener('change', handleHabituatedChange);
            checkbox.addEventListener('change', handleHabituatedChange);
        });
        document.querySelectorAll('.progress-checkbox').forEach(checkbox => {
            checkbox.removeEventListener('change', handleProgressCheckboxChange);
            checkbox.addEventListener('change', handleProgressCheckboxChange);
        });
    }

    function handleDeleteButtonClick(e) {
        const habitIdString = e.target.dataset.id;
        // console.log("Delete button clicked. data-id from element:", habitIdString, "Target element:", e.target);
        if (habitIdString) {
            deleteHabit(habitIdString);
        } else {
            // console.error("削除ボタンにID(data-id)が設定されていません。", e.target);
            showMessage("削除処理中にエラーが発生しました (ID未設定)。", "error");
        }
    }
    function handleHabituatedChange(e) {
        const habitIdString = e.target.dataset.habitId;
        if (habitIdString) toggleHabituated(habitIdString);
    }
    function handleProgressCheckboxChange(e) {
        const habitIdString = e.target.dataset.habitId;
        if (habitIdString) handleProgressCheck(habitIdString, e.target);
    }

    function getAchievementValue(habit) {
        if (habit.isHabituated) return 1.01;
        return habit.frequency > 0 ? (habit.checkedCount / habit.frequency) : 0;
    }

    function sortHabits(habitsToSort) {
        const sortBy = sortBySelect.value;
        switch (sortBy) {
            case 'category-asc': return habitsToSort.sort((a, b) => a.category.localeCompare(b.category));
            case 'category-desc': return habitsToSort.sort((a, b) => b.category.localeCompare(a.category));
            case 'period-asc': return habitsToSort.sort((a, b) => (PERIOD_ORDER[a.period] || 99) - (PERIOD_ORDER[b.period] || 99));
            case 'period-desc': return habitsToSort.sort((a, b) => (PERIOD_ORDER[b.period] || 99) - (PERIOD_ORDER[a.period] || 99));
            case 'achievement-asc': return habitsToSort.sort((a, b) => getAchievementValue(a) - getAchievementValue(b));
            case 'achievement-desc': return habitsToSort.sort((a, b) => getAchievementValue(b) - getAchievementValue(a));
            default: return habitsToSort.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
    }

    // イベントリスナーの堅牢な設定
    if (addItemBtnDetail) addItemBtnDetail.addEventListener('click', addHabit);
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', deleteAllHabits);
        // console.log("Event listener for deleteAllBtn added."); 
    } else {
        console.error("deleteAllBtn が見つかりません。HTMLのIDを確認してください。");
    }
    if (achievementDisplayTypeSelect) achievementDisplayTypeSelect.addEventListener('change', renderHabits);
    if (sortBySelect) sortBySelect.addEventListener('change', renderHabits);
    if (itemPeriodInput) itemPeriodInput.addEventListener('change', updateHints);

    // アプリケーションの初期化
    loadHabits(); 
    updateHints();
    renderHabits();
    // console.log("Application fully initialized."); 
});
