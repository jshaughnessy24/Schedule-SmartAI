import React, { useState } from 'react'
import { formatDate } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { INITIAL_EVENTS, createEventId } from './event-utils'
import 'bootswatch/dist/journal/bootstrap.min.css'; // Added this :boom:
import 'bootstrap-icons/font/bootstrap-icons.css'; // needs additional webpack config!

import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import './App.css'
import { Button, TextField } from '@mui/material'
import { useRef } from 'react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      light: '#de6666',
      main: '#de6666',
      dark: '#de6666',
      contrastText: '#fff',
    }
  },
},
);

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
        

        addTaskWithoutConflicts(eventTitles, currentTask, eventStarts, eventEnd, eventStart, eventEnds)
      }

      console.log(eventTitles)
    }
    setAddingTasks(!addingTasks)
  }

  function addTaskWithoutConflicts(eventTitles, currentTask, eventStarts, eventEnd, eventStart, eventEnds) {
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
            break
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
          break
        } else {
          eventStart.setMinutes(eventStart.getMinutes() + 30)
          eventEnd.setMinutes(eventEnd.getMinutes() + 30)
        }
      }
    }
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

  function handleShiftEvents() {
    // get events to shift
    let eventsToShift = []
    let eventsToShiftStart = []
    let eventsToShiftEnd = []

    // get current event titles
    let eventTitles = []
    let eventStarts = []
    let eventEnds = []

    calendarRef.current.getApi().getEvents().map(event => {
      if(!event.allDay) {
        console.log("timed event", event.start)
        let pre = event._instance.range.start
        let post = event._instance.range.end
        var copiedDate = new Date(event.start.getTime() + Math.abs(post.getTime()-pre.getTime()));
        if(copiedDate < new Date()) {
          eventsToShift.push(event.title)
          
          //set starting event start and end
          let eventStart = new Date();
          eventsToShiftStart.push(eventStart)
          eventsToShiftEnd.push(new Date(eventStart.getTime() + Math.abs(post.getTime()-pre.getTime())))

          //remove event from calendar
          event.remove()
        } else {
          eventTitles.push(event.title)
          eventStarts.push(event.start)
          eventEnds.push(copiedDate)
        }
      }
    })

    for(let i = 0; i < eventsToShift.length; i++) {
      
      if (!eventTitles.includes(eventsToShift[i])) {
        while (true) {
          let noConflicts = true
          for (let j = 0; j < eventStarts.length; j++) {
            if ((eventsToShiftEnd[i] >= eventStarts[j] && eventsToShiftStart[i] <= eventEnds[j])) {
              noConflicts = false
              console.log("event end", eventsToShiftEnd[i])
              console.log("eventsStart", eventStarts[j])
              console.log("event start", eventsToShiftStart[i])
              console.log("eventsEnd", eventEnds[j])
              console.log("conflict occured")
              break
            }
          }
          if (noConflicts) {
            console.log("got here")
            calendarRef.current.getApi().addEvent({
              id: createEventId(),
              title: eventsToShift[i],
              start: eventsToShiftStart[i],
              end: eventsToShiftEnd[i],
              allDay: false
            })
            eventStarts.push(eventsToShiftStart[i])
            eventEnds.push(eventsToShiftEnd[i])
            break
          } else {
            eventsToShiftStart[i].setMinutes(eventsToShiftStart[i].getMinutes() + 30)
            eventsToShiftEnd[i].setMinutes(eventsToShiftEnd[i].getMinutes() + 30)
          }
        }
      }
      
      
      // addTaskWithoutConflicts(eventTitles, {text: eventsToShift[i]}, eventStarts, eventsToShiftEnd[i], eventsToShiftStart[i], eventEnds)
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
        handleShiftEvents={handleShiftEvents}
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

function Sidebar({ addingTasks, handleAddingTasksToggle, currentEvents, handleShiftEvents }) {
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
        <div >
        <button onClick={handleShiftEvents} class="btn btn-primary">shift events?</button>
        </div>

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
      <form style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'none',
        margin: 8
      }} onSubmit={handleOnSubmit} >
        <ThemeProvider theme={theme}>
        <TextField 
          id="messageBox"
          label="Task (v1: duration defaults to 30 min, names must be unique)"
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
        </ThemeProvider>
      </form>
      <div id="out" className="chat"
        style={{ marginBottom: "8px" }}
      // style={{height:"minContent"}}
      >
        <div style={{padding: 8}}>
          <ul class="list-group">
            {
              //shows messages as long as they are not from the admin. (POTENTIALLY A PROBLEM LATER, but querying in firestore
              //requires that the orderby uses the same field as where, which makes this difficult)
              messages.map(message => {
                if (message.username !== "admin")
                  return <li class="list-group-item" key={message.id}>{message.text}</li>
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