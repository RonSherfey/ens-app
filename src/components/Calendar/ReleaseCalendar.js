import React from 'react'
import Calendar, { CalendarButton } from './Calendar'
import moment from 'moment'
import { useTranslation } from 'react-i18next'

function RenewalCalendarInvite({ startDatetime, name, noMargin }) {
  const { t } = useTranslation()
  const endDatetime = startDatetime.clone().add(2, 'hours')
  const duration = moment.duration(endDatetime.diff(startDatetime)).asHours()
  const event = {
    title: `Register ${name}`,
    description: `Register ${name} at https://app.ens.domains/name/${name}/register`,
    location: 'Everywhere',
    startDatetime: startDatetime.format('YYYYMMDDTHHmmss'),
    endDatetime: endDatetime.format('YYYYMMDDTHHmmss'),
    duration
  }

  return <Calendar event={event} noMargin={noMargin} />
}

export default RenewalCalendarInvite

export { CalendarButton }