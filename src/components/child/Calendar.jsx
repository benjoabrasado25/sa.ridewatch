import React, { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { INITIAL_EVENTS, createEventId } from '../../hook/event-utils.js'

// Simple Modal component for confirmations
function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
    if (!open) return null;
    return (
        <div
            className="modal fade show"
            style={{ display: "block", background: "rgba(0,0,0,.4)" }}
            aria-modal="true"
            role="dialog"
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content radius-12">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button type="button" className="btn-close" onClick={onCancel} />
                    </div>
                    <div className="modal-body">
                        <p className="mb-0">{message}</p>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-danger" onClick={onConfirm}>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple Input Modal for prompts
function InputModal({ open, title, onSave, onCancel }) {
    const [value, setValue] = useState('');

    const handleSave = () => {
        if (value.trim()) {
            onSave(value.trim());
            setValue('');
        }
    };

    if (!open) return null;
    return (
        <div
            className="modal fade show"
            style={{ display: "block", background: "rgba(0,0,0,.4)" }}
            aria-modal="true"
            role="dialog"
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content radius-12">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button type="button" className="btn-close" onClick={() => { setValue(''); onCancel(); }} />
                    </div>
                    <div className="modal-body">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter event title"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => { setValue(''); onCancel(); }}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleSave}>
                            Add Event
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Calendar() {
    const [confirmModal, setConfirmModal] = useState({ open: false, event: null });
    const [inputModal, setInputModal] = useState({ open: false, selectInfo: null });

    function handleDateSelect(selectInfo) {
        setInputModal({ open: true, selectInfo });
    }

    function handleInputSave(title) {
        const { selectInfo } = inputModal;
        if (selectInfo) {
            let calendarApi = selectInfo.view.calendar;
            calendarApi.unselect();
            calendarApi.addEvent({
                id: createEventId(),
                title,
                start: selectInfo.startStr,
                end: selectInfo.endStr,
                allDay: selectInfo.allDay
            });
        }
        setInputModal({ open: false, selectInfo: null });
    }

    function handleEventClick(clickInfo) {
        setConfirmModal({ open: true, event: clickInfo.event });
    }

    function handleConfirmDelete() {
        if (confirmModal.event) {
            confirmModal.event.remove();
        }
        setConfirmModal({ open: false, event: null });
    }

    return (
        <div className='demo-app'>

            <div className='demo-app-main'>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{

                        left: 'title',
                        center: 'timeGridDay,timeGridWeek,dayGridMonth',
                        right: 'prev,next today'
                    }}
                    initialView='dayGridMonth'
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    initialEvents={INITIAL_EVENTS}
                    select={handleDateSelect}
                    eventContent={renderEventContent}
                    eventClick={handleEventClick}

                />
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                open={confirmModal.open}
                title="Delete Event"
                message={`Are you sure you want to delete the event '${confirmModal.event?.title || ''}'?`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmModal({ open: false, event: null })}
            />

            {/* Add Event Modal */}
            <InputModal
                open={inputModal.open}
                title="Add New Event"
                onSave={handleInputSave}
                onCancel={() => {
                    if (inputModal.selectInfo) {
                        inputModal.selectInfo.view.calendar.unselect();
                    }
                    setInputModal({ open: false, selectInfo: null });
                }}
            />
        </div>
    )
}

function renderEventContent(eventInfo) {
    return (
        <>
            <b>{eventInfo.timeText}</b>
            <i>{eventInfo.event.title}</i>
        </>
    )
}


