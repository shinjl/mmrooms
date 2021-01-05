MMR.initializeDetailPage = async () => {
    const ONE_DAY_IN_MILLIS = 24 * 60 * 60 * 1000;
    const FIFTEEN_MINUTES_IN_MILLIS = 15 * 60 * 1000;

    // Fetched reservation detail data
    let reservationInfo = [];
    // Fetched reservation time: From
    let reservationFrom = '';
    // Fetched reservation time: From
    let reservationTo = '';
    // Fetched reservation target rooms
    let reservationRooms = [];

    /**
     * Show tooltip
     * @param {*} text Tooltip contents
     * @param {*} x Tooltip position X
     * @param {*} y Tooltip position Y
     */
    const showTooltip = (text, x, y) => {
        const tooltipElement = document.querySelector('#tooltip');
        tooltipElement.innerHTML = text;
        tooltipElement.style.display = 'block';
        tooltipElement.style.left = `${x}px`;
        tooltipElement.style.top = `${y}px`;
        tooltipElement.style.opacity = '1';
    };

    /**
     * Hide tooltip
     */
    const hideTooltip = () => {
        const tooltipElement = document.querySelector('#tooltip');
        tooltipElement.innerHTML = '';
        tooltipElement.style.opacity = '0';
    };

    // Generate cell ID
    const generateCellId = (roomId, targetDatetime) => {
        const dayStrSimple = MMR.formatDateSimple(targetDatetime);
        const timeStrSimple = `${MMR.padToTwo(targetDatetime.getHours())}${MMR.padToTwo(targetDatetime.getMinutes())}`;
        return `${roomId}${dayStrSimple}${timeStrSimple}`;
    };

    /**
     * Create data grid from search result
     * @param {*} fromDateValue From date (yyyy/MM/dd)
     * @param {*} toDateValue To date (yyyy/MM/dd)
     * @param {*} fromTimeValue From time (0~23)
     * @param {*} toTimeValue To time (0~23)
     * @param {*} areas Selected Areas
     */
    const createGrid = (fromDateValue, toDateValue, fromTimeValue, toTimeValue, areas) => {
        // Clear previous data
        const parentDiv = document.querySelector('#data-grid');
        parentDiv.innerHTML = '';

        // Add empty column for area/room/day grid cell to keep alignment with time header
        const createDummyDiv = () => {
            const div = document.createElement('div');
            div.classList.add('dummy');
            div.innerHTML = '&nbsp;';
            return div;
        };
        for (let i = 0; i < 6; i++) {
            const dummy = createDummyDiv();
            if (i === 2 || i === 5) {
                dummy.classList.add('dummy-last');
            }
            parentDiv.appendChild(dummy);
        }

        // Create area/room/day grid
        let totalRowNumber = 1;
        for (let i = 0; i < areas.length; i++) {
            const roomInCurrentArea = reservationRooms.filter((room) => room.areaId === areas[i].areaId);
            const roomCount = roomInCurrentArea.length;
            const areaName = areas[i].areaName;

            for (let j = 0; j < roomCount; j++) {
                const roomName = roomInCurrentArea[j].roomName;

                for (let k = fromDateValue.getTime(); k <= toDateValue.getTime(); k += ONE_DAY_IN_MILLIS) {
                    const areaDiv = document.createElement('div');
                    areaDiv.classList.add('grid-area');
                    if (j === 0 && k === fromDateValue.getTime()) {
                        areaDiv.innerHTML = areaName;
                    } else {
                        areaDiv.innerHTML = '&nbsp;';
                    }
                    parentDiv.appendChild(areaDiv);

                    const roomDiv = document.createElement('div');
                    roomDiv.classList.add('grid-room');
                    if (k === fromDateValue.getTime()) {
                        roomDiv.innerHTML = roomName;
                    } else {
                        roomDiv.innerHTML = '&nbsp;';
                    }
                    parentDiv.appendChild(roomDiv);

                    const dayDiv = document.createElement('div');
                    dayDiv.innerHTML = MMR.formatDateShort(new Date(k));
                    dayDiv.classList.add('grid-day');
                    parentDiv.appendChild(dayDiv);

                    totalRowNumber++;
                }
            }
        }

        // Create time header
        const detailDiv = document.createElement('div');
        detailDiv.classList.add('detail-grid');
        detailDiv.style.gridArea = `1 / 4 / span ${totalRowNumber}`; // Detail grid started from row:1 column:4 and span across all rows
        let hourCounter = 1;
        for (let t = fromTimeValue; t <= toTimeValue; t++) {
            const hourElement = document.createElement('div');
            hourElement.innerHTML = `${MMR.padToTwo(t)}`;
            hourElement.classList.add('h1');
            hourElement.style.gridColumn = `${hourCounter} / span 4`;
            detailDiv.appendChild(hourElement);
            // 4 * 15min = 1hour
            hourCounter += 4;
        }
        let timeColumnCounter = 0;
        for (let t = fromTimeValue; t <= toTimeValue; t++) {
            for (let x = 0; x <= 45; x += 15) {
                const minuteElement = document.createElement('div');
                minuteElement.innerHTML = `${MMR.padToTwo(x)}`;
                minuteElement.classList.add('h2');
                detailDiv.appendChild(minuteElement);
                timeColumnCounter++;
            }
        }
        detailDiv.style.gridTemplateColumn = `repeat(${timeColumnCounter}, 1fr)`;

        // Create detail grid
        for (let i = 0; i < areas.length; i++) {
            const roomInCurrentArea = reservationRooms.filter((room) => room.areaId === areas[i].areaId);
            const roomCount = roomInCurrentArea.length;
            for (let j = 0; j < roomCount; j++) {
                const roomId = roomInCurrentArea[j].roomId;
                const roomName = roomInCurrentArea[j].roomName;
                for (let k = fromDateValue.getTime(); k <= toDateValue.getTime(); k += ONE_DAY_IN_MILLIS) {
                    let targetDate = new Date(k);
                    targetDate.setHours(0, 0, 0, 0);
                    let no = 0;
                    for (let t = fromTimeValue; t <= toTimeValue; t++) {
                        for (let x = 0; x <= 45; x += 15) {
                            targetDate.setMinutes(x);
                            const cell = document.createElement('div');
                            cell.classList.add('c0');
                            const dayStr = MMR.formatDate(targetDate);
                            const dayStrSimple = MMR.formatDateSimple(targetDate);
                            const timeStr = `${MMR.padToTwo(t)}:${MMR.padToTwo(x)}`;
                            const timeStrSimple = `${MMR.padToTwo(t)}${MMR.padToTwo(x)}`;

                            // Use roomId+Datetime(yyyyMMddHHmm) as unique ID for each cell
                            cell.id = `${roomId}${dayStrSimple}${timeStrSimple}`;

                            // Register some custom attribute for further use
                            cell.setAttribute('roomId', roomId);
                            cell.setAttribute('roomName', roomName);
                            cell.setAttribute('datetime', `${dayStr} ${timeStr}`);
                            cell.setAttribute('no', no++);
                            cell.setAttribute('rowKey', `${roomId}${dayStr}`);
                            detailDiv.appendChild(cell);
                        }
                    }
                }
            }
        }
        // Add detail grid to parent grid
        parentDiv.appendChild(detailDiv);

        // Show grid
        parentDiv.style.gridTemplateRows = `repeat(${totalRowNumber}, 27px)`;
        parentDiv.style.display = 'grid';

        // Get latest reservation data and plot in the grid
        refreshReservations();

        // Register mouse drag events
        mouseEvents(detailDiv);
    };

    /**
     * Get latest reservation data and plot in the grid
     */
    const refreshReservations = async () => {
        // First clear all styles
        const removeClasses = (cell, classes) => {
            classes.forEach((clazz) => {
                cell.classList.remove(clazz);
            });
        };
        document.querySelectorAll('.c0').forEach((cell) => {
            cell.removeAttribute('r1');
            cell.removeAttribute('r2');
            removeClasses(cell, ['c1', 'c2', 'cx', 'cy', 'cz']);
        });

        // Get latest reservation data and replot in the grid
        reservationInfo = [];
        let reservationIndex = 0;
        const roomIds = reservationRooms.map((room) => room.roomId);
        const reservationToDatetime = new Date(new Date(reservationTo).getTime() + 60 * 60 * 1000);
        const reservations = await GRAPHQL.getRoomReservations(
            reservationFrom,
            MMR.formatDateFull(reservationToDatetime),
            roomIds
        );
        reservations.forEach((reservation) => {
            const { user, roomId, from, to } = reservation;
            const reservedFrom = new Date(from);
            const reservedTo = new Date(to);
            reservationInfo[reservationIndex] = reservation;
            for (let k = reservedFrom.getTime(); k < reservedTo.getTime(); k += FIFTEEN_MINUTES_IN_MILLIS) {
                const cellId = generateCellId(roomId, new Date(k));
                const cell = document.querySelector(`#${cellId}`);
                if (cell) {
                    if (user === MMR.currentUserID) {
                        cell.setAttribute('r1', reservationIndex);
                        cell.classList.add('c1');
                    } else {
                        cell.setAttribute('r2', reservationIndex);
                        cell.classList.add('c2');
                    }
                    if (k === reservedFrom.getTime()) {
                        cell.classList.add('cx');
                    } else if (k === reservedTo.getTime() - FIFTEEN_MINUTES_IN_MILLIS) {
                        cell.classList.add('cz');
                    } else {
                        cell.classList.add('cy');
                    }
                }
            }
            reservationIndex++;
        });
    };

    /**
     * Register mouse drag events
     * @param {*} detailDiv Grid container element
     */
    const mouseEvents = (detailDiv) => {
        // Get the element on the current mouse position
        const getCell = (e) => {
            const event = e || window.event;
            const element = document.elementFromPoint(event.clientX, event.clientY);
            if (!element) {
                return null;
            }
            if (element.hasAttribute('roomId')) {
                return element;
            }
            return null;
        };

        // Disable all mouse event while dragging
        const disableMouseEvent = (e) => {
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();
            e.cancelBubble = true;
            e.returnValue = false;
            return false;
        };

        let dragging = false;
        let direction = 0; // 1: right, -1: left
        let startingPoint = null;
        let previousPoint = null;
        let selectedCells = {};

        // Change selected cell background according to their position
        const refreshCells = () => {
            const cellArray = Object.values(selectedCells);
            const cellArraySorted = cellArray.sort((a, b) => {
                // Sort by cell no
                const aNo = a.getAttribute('no') - 0;
                const bNo = b.getAttribute('no') - 0;
                return aNo - bNo;
            });
            for (let i = 0; i < cellArraySorted.length; i++) {
                const cell = cellArraySorted[i];
                resetCell(cell);
                if (i === 0) {
                    cell.classList.add('xx');
                } else if (i === cellArraySorted.length - 1) {
                    cell.classList.add('xz');
                } else {
                    cell.classList.add('xy');
                }
            }
        };

        // Reset the cell to default value
        const resetCell = (cell) => {
            cell.classList.remove('xx');
            cell.classList.remove('xy');
            cell.classList.remove('xz');
        };

        // Check if the cell is in the reserved range
        const isReserved = (cell) => {
            return cell.hasAttribute('r1') || cell.hasAttribute('r2');
        };

        // Mouse down event
        detailDiv.addEventListener('mousedown', async (e) => {
            const cell = getCell(e);
            if (cell) {
                if (isReserved(cell)) {
                    dragging = false;
                    let reservationIndex = cell.getAttribute('r1');
                    if (reservationIndex == null) {
                        reservationIndex = cell.getAttribute('r2');
                    }
                    const reservation = reservationInfo[reservationIndex - 0];
                    const success = await RESERVATION.editReservation(reservation);
                    if (success) {
                        refreshReservations();
                    }
                } else {
                    dragging = true;
                    direction = 0;
                    startingPoint = cell;
                    previousPoint = cell;
                    selectedCells[cell.id] = cell;
                    cell.classList.add('xx');
                }
            } else {
                dragging = false;
            }
            hideTooltip();
            return disableMouseEvent(e);
        });

        // Mouse move event
        detailDiv.addEventListener('mousemove', (e) => {
            const cell = getCell(e);
            if (!cell) {
                if (dragging) {
                    return disableMouseEvent(e);
                } else {
                    hideTooltip();
                    return;
                }
            }

            const reserved = isReserved(cell);
            if (dragging) {
                if (reserved) {
                    return disableMouseEvent(e);
                }

                if (cell.id === previousPoint.id) {
                    // Same cell, ignore
                    return disableMouseEvent(e);
                }

                if (cell.getAttribute('rowKey') !== startingPoint.getAttribute('rowKey')) {
                    // Different row, ignore
                    return disableMouseEvent(e);
                }

                // Use cell no to decide direction
                const previousNo = previousPoint.getAttribute('no') - 0;
                const currentNo = cell.getAttribute('no') - 0;

                if (selectedCells[cell.id]) {
                    // Selected cell has been selected again, unselect all cells on same direction
                    if (direction !== 0) {
                        for (const key in selectedCells) {
                            const selectedCell = selectedCells[key];
                            if (startingPoint.id === selectedCell.id) {
                                // Cannot delete the starting cell
                                continue;
                            }

                            const selectedNo = selectedCell.getAttribute('no') - 0;
                            let deleteCell = false;
                            if (direction > 0) {
                                // Remove all cell on the right
                                deleteCell = selectedNo > currentNo;
                            } else {
                                // Remove all cell on the left
                                deleteCell = selectedNo < currentNo;
                            }
                            if (deleteCell) {
                                resetCell(selectedCell);
                                selectedCells[key] = null;
                                delete selectedCells[key];
                            }
                        }
                    }
                    if (Object.keys(selectedCells).length === 1) {
                        // Reset the direction when returning to the starting point
                        direction = 0;
                    }
                    previousPoint = cell;
                    refreshCells();
                    return disableMouseEvent(e);
                }

                if (Math.abs(previousNo - currentNo) === 1) {
                    // Adjacent cell
                    if (direction === 0) {
                        // First move, decide the direction
                        direction = previousNo < currentNo ? 1 : -1;
                    }
                    previousPoint = cell;
                    selectedCells[cell.id] = cell;
                    refreshCells();
                } else {
                    // Jumped over adjacent cell
                    // Check if the cells between starting point and current point are available
                    const currentDirection = previousNo < currentNo ? 1 : -1;
                    if (direction === 0) {
                        // First move, decide the direction
                        direction = currentDirection;
                    } else {
                        if (direction !== currentDirection) {
                            // Different direction, ignore
                            return disableMouseEvent(e);
                        }
                    }
                    const roomId = cell.getAttribute('roomId');
                    const previousDatetime = new Date(previousPoint.getAttribute('datetime'));
                    const currentDatetime = new Date(cell.getAttribute('datetime'));
                    let needRefreshCells = false;
                    if (direction > 0) {
                        for (
                            let k = previousDatetime.getTime() + FIFTEEN_MINUTES_IN_MILLIS;
                            k <= currentDatetime.getTime();
                            k += FIFTEEN_MINUTES_IN_MILLIS
                        ) {
                            const middleCellId = generateCellId(roomId, new Date(k));
                            const middleCell = document.querySelector(`#${middleCellId}`);
                            if (middleCell) {
                                if (isReserved(middleCell)) {
                                    break;
                                } else {
                                    selectedCells[middleCellId] = middleCell;
                                    needRefreshCells = true;
                                }
                            } else {
                                break;
                            }
                        }
                    } else {
                        for (
                            let k = previousDatetime.getTime();
                            k > currentDatetime.getTime();
                            k -= FIFTEEN_MINUTES_IN_MILLIS
                        ) {
                            const middleCellId = generateCellId(roomId, new Date(k));
                            const middleCell = document.querySelector(`#${middleCellId}`);
                            if (middleCell) {
                                if (isReserved(middleCell)) {
                                    break;
                                } else {
                                    selectedCells[middleCellId] = middleCell;
                                    needRefreshCells = true;
                                }
                            } else {
                                break;
                            }
                        }
                    }
                    if (needRefreshCells) {
                        refreshCells();
                    }
                }
            } else {
                const roomName = cell.getAttribute('roomName');
                let tooltipText = '';
                let offsetX = 6;
                let offsetY = 5;
                if (reserved) {
                    // Show reservation detail
                    let reservationIndex = cell.getAttribute('r1');
                    let infoText = MMR.currentLangResource.clickToEdit;
                    if (reservationIndex == null) {
                        reservationIndex = cell.getAttribute('r2');
                        infoText = MMR.currentLangResource.clickToCViewDetails;
                    }
                    const reservation = reservationInfo[reservationIndex - 0];
                    const { from, to } = reservation;
                    tooltipText = `<p class="p1">${roomName}</p><p class="p2">${from} - ${to}</p><p class="p3">${infoText}</p>`;
                    offsetX = 15;
                    offsetY = 10;
                } else {
                    // Show the room and time of the current cell
                    const datetime = cell.getAttribute('datetime');
                    tooltipText = `<p class="p1">${roomName}</p><p class="p2">${datetime}</p><p class="p3">${MMR.currentLangResource.clickToReserve}</p>`;
                }
                showTooltip(tooltipText, e.pageX + offsetX, e.pageY + offsetY);
            }

            if (dragging) {
                return disableMouseEvent(e);
            }
        });

        // Mouse out event
        detailDiv.addEventListener('mouseout', (e) => {
            hideTooltip();
        });

        // Mouse up event
        window.addEventListener('mouseup', async (e) => {
            if (dragging) {
                dragging = false;

                // Popup edit dialog to create a new reservation from current selection
                const cellArray = Object.values(selectedCells);
                const cellArraySorted = cellArray.sort((a, b) => {
                    // Sort by cell no
                    const aNo = a.getAttribute('no') - 0;
                    const bNo = b.getAttribute('no') - 0;
                    return aNo - bNo;
                });
                const cellFrom = cellArraySorted[0];
                const roomId = cellFrom.getAttribute('roomId');
                const roomName = cellFrom.getAttribute('roomName');
                const cellTo = cellArraySorted[cellArraySorted.length - 1];
                const from = cellFrom.getAttribute('datetime');
                const toDatetimeValue = new Date(cellTo.getAttribute('datetime'));
                // To should be set as start of the next cell, so plus 15 minutes
                const to = MMR.formatDateFull(new Date(toDatetimeValue.getTime() + FIFTEEN_MINUTES_IN_MILLIS));
                const success = await RESERVATION.editReservation({ from, to, roomId, roomName }, () => {});
                if (success) {
                    refreshReservations();
                }
                direction = 0;
                selectedCells = {};
                document.querySelectorAll('.c0').forEach((element) => {
                    resetCell(element);
                });
            }
        });
    };

    /**
     * Refresh room selector option items
     * @param {*} selectedAreas Selected areas
     */
    const refreshRoomOptions = async (selectedAreas) => {
        // Get all selected area and create ID array
        let areaIds = [];
        selectedAreas.forEach((area) => {
            areaIds.push(area.areaId);
        });
        if (areaIds.length > 0) {
            return await GRAPHQL.getRooms(areaIds);
        } else {
            return [];
        }
    };

    // Get all areas
    let areas = await GRAPHQL.getAreas();

    // Default range: from nearest 15 minute to 6 hours ahead
    let defaultFromDate = new Date();
    let defaultToDate = 0;
    if (defaultFromDate.getHours() > 12) {
        // Set the default To date to next day
        defaultToDate = new Date(defaultFromDate.getTime() + ONE_DAY_IN_MILLIS);
    } else {
        defaultToDate = new Date(defaultFromDate.getTime());
    }
    defaultFromDate.setHours(0, 0, 0, 0);
    defaultToDate.setHours(0, 0, 0, 0);

    // Initialize Vue
    const detailsVue = new Vue({
        el: '#details',
        components: {
            Multiselect: window.VueMultiselect.default,
        },
        data: {
            MMR_LANG: MMR.currentLangResource,
            areaSelected: [],
            areaOptions: areas,
            roomSelected: [],
            roomOptions: [],
            timeOptions: MMR.timeSelectOptions1hour(),
            fromDate: MMR.formatDate(defaultFromDate),
            fromTime: '09:00',
            toDate: MMR.formatDate(defaultToDate),
            toTime: '16:00',
            searched: false,
        },
        // Note: arrow function does not work properly inside methods because of 'this' pointed to the different object
        methods: {
            // Reload to apply language changes
            reload: async function () {
                this.MMR_LANG = MMR.currentLangResource;

                // Language setting has change so refresh area data
                areas = await GRAPHQL.getAreas();
                this.areaOptions = areas;

                // Apply language changes to selected area items
                this.areaSelected.forEach((area) => {
                    const newAreaDetail = areas.find((areaOption) => areaOption.areaId === area.areaId);
                    if (newAreaDetail) {
                        area.areaName = newAreaDetail.areaName;
                    }
                });

                // Apply language changes to selected room items
                const rooms = await refreshRoomOptions(this.areaSelected);
                this.roomOptions = rooms;
                this.roomSelected.forEach((room) => {
                    const newRoomDetail = rooms.find((roomOption) => roomOption.roomId === room.roomId);
                    if (newRoomDetail) {
                        room.roomName = newRoomDetail.roomName;
                    }
                });

                if (this.searched) {
                    // Existing previous search result, do it again manually
                    this.search();
                }
            },
            // Change the room selection items when area selection changes
            areaChange: async function () {
                this.roomSelected = [];
                this.roomOptions = await refreshRoomOptions(this.areaSelected);
            },
            // Check required items, move focus to the first empty required item
            checkRequired: function (value, ref) {
                if (value == null || value === '' || value === undefined) {
                    MMR.showNotification(MMR.currentLangResource.errorRequired, '');
                    ref.focus();
                    return false;
                }
                return true;
            },
            // Fired when the input changes
            updateInput: function () {
                this.$forceUpdate();
            },
            // Search and show result as grid
            search: async function () {
                // Requirement check
                if (!this.areaSelected || this.areaSelected.length == 0) {
                    MMR.showNotification(MMR.currentLangResource.errorAreaRequired, '');
                    return;
                }
                const requiredItems = [
                    { value: this.fromDate, ref: this.$refs.fromDate },
                    { value: this.fromTime, ref: this.$refs.fromTime },
                    { value: this.toDate, ref: this.$refs.toDate },
                    { value: this.toTime, ref: this.$refs.toTime },
                ];
                for (let i = 0; i < requiredItems.length; i++) {
                    if (!this.checkRequired(requiredItems[i].value, requiredItems[i].ref)) {
                        return;
                    }
                }

                // Validation check
                const fromDateValue = new Date(this.fromDate);
                const toDateValue = new Date(this.toDate);
                if (isNaN(fromDateValue.getTime())) {
                    MMR.showNotification(MMR.currentLangResource.errorInvalidDate, '');
                    this.$refs.fromDate.focus();
                    return;
                }
                if (isNaN(toDateValue.getTime())) {
                    MMR.showNotification(MMR.currentLangResource.errorInvalidDate, '');
                    this.$refs.toDate.focus();
                    return;
                }

                // Term check
                const term = toDateValue.getTime() - fromDateValue.getTime();
                if (term < 0) {
                    MMR.showNotification(MMR.currentLangResource.errorInvalidTermDate, '');
                    this.$refs.fromDate.focus();
                    return;
                }
                if (term > 30 * 24 * 60 * 60 * 1000) {
                    // The term is larger than 30 days
                    MMR.showNotification(MMR.currentLangResource.errorTermTooLongForSearch, '');
                    this.$refs.fromDate.focus();
                    return;
                }
                // The mm of HH:mm is always 0, so use hour value only
                const fromTimeValue = this.fromTime.substring(0, 2) - 0;
                const toTimeValue = this.toTime.substring(0, 2) - 0;
                if (fromTimeValue >= toTimeValue) {
                    // From time is larger than To time
                    MMR.showNotification(MMR.currentLangResource.errorInvalidTermTime, '');
                    this.$refs.fromTime.focus();
                    return;
                }

                // Keep from/to and rooms data in memory for further use
                reservationFrom = `${this.fromDate} ${this.fromTime}`;
                reservationTo = `${this.toDate} ${this.toTime}`;
                reservationRooms = this.roomSelected;
                if (!reservationRooms || reservationRooms.length == 0) {
                    // Show all rooms if no room is selected
                    reservationRooms = this.roomOptions;
                }

                // Create data grid
                createGrid(fromDateValue, toDateValue, fromTimeValue, toTimeValue, this.areaSelected);
                this.searched = true;
            },
        },
    });

    // Show contents after Vue initialization
    MMR.showElement('details', 'flex');

    // Register calendar popup controller etc
    MMR.prepareCalendarEvents();

    // Back to home button event, just reload page
    document.querySelector('#back-to-home').addEventListener('click', (event) => {
        location.href = '/';
    });

    // Return VUE object for further use
    return detailsVue;
};
