import React, { useState } from 'react'
import { formatDate } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { INITIAL_EVENTS, createEventId } from './event-utils'
import 'bootswatch/dist/journal/bootstrap.min.css'; // Added this :boom:
import 'bootstrap-icons/font/bootstrap-icons.css'; // needs additional webpack config!

import { Calendar } from '@fullcalendar/core';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import './App.css'
import { Button, TextField } from '@mui/material'
import { useRef } from 'react';

export default function App() {
  const [weekendsVisible, setWeekendsVisible] = useState(true)
  const [currentEvents, setCurrentEvents] = useState([])
  const [addingTasks, setAddingTasks] = useState(true)
  const [currentTasks, setCurrentTasks] = useState([]);

  const calendarRef = useRef(null)

  function handleAddingTasksToggle() {

    // if going back to calendar view, add tasks just one after another lol
    if (addingTasks) {
      // get current event titles
      let eventTitles = []
      let eventStarts = []
      let eventEnds = []
      // console.log(calendarRef.current.getApi().currentData.currentDate)
      calendarRef.current.getApi().getEvents().map(event => {
        if(!event.allDay) {
          console.log("timed event", event.start)
          let pre = event._instance.range.start
          let post = event._instance.range.end
          var copiedDate = new Date(event.start.getTime() + Math.abs(post.getTime()-pre.getTime()));
          console.log("timed event end", copiedDate)
          eventStarts.push(event.start)
          eventEnds.push(copiedDate)
        }
        eventTitles.push(event.title)
      })

      // get tasks that haven't already been added as events
      for(const currentTask of currentTasks) {
        let eventStart = new Date();
        let eventEnd = new Date();
        eventEnd.setMinutes(eventEnd.getMinutes() + 30);
        

        if (!eventTitles.includes(currentTask.text)) {
          while (true) {
            let noConflicts = true
            for (let i = 0; i < eventStarts.length; i++) {
              if ((eventEnd >= eventStarts[i] && eventStart <= eventEnds[i])) {
                noConflicts = false
                console.log("event end", eventEnd)
                console.log("eventsStart", eventStarts[i])
                console.log("event start", eventStart)
                console.log("eventsEnd", eventEnds[i])
                console.log("conflict occured")
                break;
              }
            }
            if (noConflicts) {
              console.log("got here")
              calendarRef.current.getApi().addEvent({
                id: createEventId(),
                title: currentTask.text,
                start: eventStart,
                end: eventEnd,
                allDay: false
              })
              eventStarts.push(eventStart)
              eventEnds.push(eventEnd)
              break;
            } else {
              eventStart.setMinutes(eventStart.getMinutes() + 30)
              eventEnd.setMinutes(eventEnd.getMinutes() + 30)
            }
          }
        }
      }

      console.log(eventTitles)
    }
    setAddingTasks(!addingTasks)
  }

  function handleDateSelect(selectInfo) {
    let title = prompt('Please enter a new title for your event')
    let calendarApi = selectInfo.view.calendar

    calendarApi.unselect() // clear date selection

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      })
    }
  }



  function handleEventClick(clickInfo) {
    // if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
    // clickInfo.event.remove()
    // }
  }

  function handleEvents(events) {
    setCurrentEvents(events)
  }

  return (
    <div className='demo-app'>
      <Sidebar
        addingTasks={addingTasks}
        handleAddingTasksToggle={handleAddingTasksToggle}
        currentEvents={currentEvents}
      />
      <>
        <div className='demo-app-main' style={addingTasks ? {display: 'none'} : {}}>
          <FullCalendar
            
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrap5Plugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            ref={calendarRef}
            initialView='timeGridDay'
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            eventBackgroundColor='#de6666'
            eventBorderColor='white'
            longPressDelay={500}
            nowIndicator={true}
            themeSystem='bootstrap5'
            weekends={weekendsVisible}
            initialEvents={INITIAL_EVENTS} // alternatively, use the `events` setting to fetch from a feed
            select={handleDateSelect}
            eventContent={renderEventContent} // custom render function
            eventClick={handleEventClick}
            eventsSet={handleEvents} // called after events are initialized/added/changed/removed
          /* you can update a remote database when these fire:
          eventAdd={function(){}}
          eventChange={function(){}}
          eventRemove={function(){}}
          */
          />
        </div>
      </>
      {addingTasks ? <CurrentTasks messages={currentTasks} setMessages={setCurrentTasks}></CurrentTasks> : <></>}
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

function Sidebar({ addingTasks, handleAddingTasksToggle, currentEvents }) {
  return (
    <div className='demo-app-sidebar' style={{padding: 8}}>
      <div className='demo-app-sidebar-section'>
        <h2>Instructions</h2>
        <ul>
          <li>Select dates and you will be prompted to create a new event</li>
          <li>Drag, drop, and resize events</li>
        </ul>
      </div>
      <div className='demo-app-sidebar-section'>
        <label>
          <input
            type='checkbox'
            checked={addingTasks}
            onChange={handleAddingTasksToggle}
          ></input>
          Adding tasks?
        </label>
      </div>
      {addingTasks ? <>

      </> : <div className='demo-app-sidebar-section'>
        <h2>All Events ({currentEvents.length})</h2>
        <ul>
          {currentEvents.map((event) => (
            <SidebarEvent key={event.id} event={event} />
          ))}
        </ul>
      </div>}
    </div>
  )
}

function CurrentTasks({ messages, setMessages }) {
  const [newMessage, setNewMessage] = useState('');

  const handleOnChange = e => {
    setNewMessage(e.target.value);
    // const element = document.getElementById("chat");
    // element.firstChild.scrollIntoView();
  };

  const handleOnSubmit = e => {
    e.preventDefault();
    messages.push({
      text: newMessage,
      createdAt: Date.now()
    })

    // document.getElementById('messageBox').value = '';    //from https://www.w3schools.com/howto/howto_html_clear_input.asp
    setNewMessage("");
  }


  return (
    <>
      <form className="form-for-chat" style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'none',
        margin: 8
      }} onSubmit={handleOnSubmit} >
        <TextField
          id="messageBox"
          label="Task (v1: duration defaults to 30 min)"
          variant="outlined"
          type="text"
          size="small"
          style={{ width: "100%" }}
          value={newMessage}
          onChange={handleOnChange}
        // placeholder="Type your message here..."
        // id="messageBox"
        />
        <Button variant="contained" type="submit" size="medium" style={{ marginLeft: "8px" }} disabled={!newMessage}>
          Send
        </Button>
      </form>
      <div id="out" className="chat"
        style={{ marginBottom: "8px" }}
      // style={{height:"minContent"}}
      >
        <div>
          <ul>
            {
              //shows messages as long as they are not from the admin. (POTENTIALLY A PROBLEM LATER, but querying in firestore
              //requires that the orderby uses the same field as where, which makes this difficult)
              messages.map(message => {
                if (message.username !== "admin")
                  return <li key={message.id}>{message.text}</li>
              })
            }
          </ul>
        </div>
      </div>

    </>
  )
}

function SidebarEvent({ event }) {
  return (
    <li key={event.id}>
      <b>{formatDate(event.start, { year: 'numeric', month: 'short', day: 'numeric' })}</b>
      <i>{event.title}</i>
    </li>
  )
}