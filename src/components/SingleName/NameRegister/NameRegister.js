import React, { useState, useReducer } from 'react'
import styled from '@emotion/styled/macro'
import { useTranslation } from 'react-i18next'
import { Query, useQuery } from 'react-apollo'
import moment from 'moment'
import {
  GET_MINIMUM_COMMITMENT_AGE,
  GET_RENT_PRICE,
  GET_PREMIUM,
  GET_TIME_UNTIL_PREMIUM
} from 'graphql/queries'
import { useInterval, useEthPrice } from 'components/hooks'
import { registerMachine, registerReducer } from './registerReducer'
import { sendNotification } from './notification'
import { calculateDuration, yearInSeconds } from 'utils/dates'

import Loader from 'components/Loader'
import Explainer from './Explainer'
import CTA from './CTA'
import Progress from './Progress'
import NotAvailable from './NotAvailable'
import Pricer from '../Pricer'
import EthVal from 'ethval'
import { formatDate } from 'utils/dates'
import DefaultInput from '../../Forms/Input'
import LineGraph from './LineGraph'
import Premium from './Premium'

const NameRegisterContainer = styled('div')`
  padding: 20px 40px;
`

const PremiumWarning = styled('div')`
  background-color: #fef6e9;
  color: #d8d8d8;
  padding: 1em;
  margin-bottom: 1em;
`

const NameRegister = ({
  domain,
  waitTime,
  refetch,
  refetchIsMigrated,
  readOnly,
  registrationOpen
}) => {
  const { t } = useTranslation()
  const [step, dispatch] = useReducer(
    registerReducer,
    registerMachine.initialState
  )
  const incrementStep = () => dispatch('NEXT')
  const decrementStep = () => dispatch('PREVIOUS')
  const [years, setYears] = useState(1)
  const [secondsPassed, setSecondsPassed] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const { loading: ethUsdPriceLoading, price: ethUsdPrice } = useEthPrice()
  const [premium, setPremium] = useState(0)

  useInterval(
    () => {
      if (secondsPassed < waitTime) {
        setSecondsPassed(s => s + 1)
      } else {
        setTimerRunning(false)
        incrementStep()
        sendNotification(`${domain.name} ${t('register.notifications.ready')}`)
      }
    },
    timerRunning ? 1000 : null
  )

  const parsedYears = parseFloat(years)
  const duration = calculateDuration(years)
  const { data: { getRentPrice } = {}, loading: rentPriceLoading } = useQuery(
    GET_RENT_PRICE,
    {
      variables: {
        duration,
        label: domain.label
      }
    }
  )

  const expiryTime = domain.expiryTime && domain.expiryTime.getTime() / 1000
  const { data: { getPremium } = {}, loading: getPremiumLoading } = useQuery(
    GET_PREMIUM,
    {
      variables: {
        name: domain.label,
        expires: expiryTime,
        duration
      }
    }
  )
  const {
    data: { getTimeUntilPremium } = {},
    loading: getTimeUntilPremiumLoading
  } = useQuery(GET_TIME_UNTIL_PREMIUM, {
    variables: {
      expires: expiryTime,
      amount: premium
    }
  })
  const releasedDate = moment(expiryTime * 1000).add(90, 'days')
  let zeroPremiumDate, premiumInEth, ethUsdPremiumPrice
  if (getTimeUntilPremium) {
    zeroPremiumDate = new Date(getTimeUntilPremium.toNumber() * 1000)
  }
  if (getPremium) {
    premiumInEth = new EthVal(getPremium.toString()).toEth().toFixed(2)
    ethUsdPremiumPrice = premiumInEth * ethUsdPrice
  }

  const oneMonthInSeconds = 2419200
  const twentyEightDaysInYears = oneMonthInSeconds / yearInSeconds
  const isAboveMinDuration = parsedYears > twentyEightDaysInYears
  const waitPercentComplete = (secondsPassed / waitTime) * 100

  if (!registrationOpen) return <NotAvailable domain={domain} />
  const handlePremium = evt => {
    const { name, value } = evt.target
    if (!isNaN(value) && parseFloat(premiumInEth) >= parseFloat(premium)) {
      console.log({ value })
      const valueInWei = new EthVal(value, 'eth').toWei().toString(16)
      setPremium(valueInWei)
    }
  }

  return (
    <NameRegisterContainer>
      {step === 'PRICE_DECISION' && (
        <Pricer
          name={domain.label}
          duration={duration}
          years={years}
          setYears={setYears}
          ethUsdPriceLoading={ethUsdPriceLoading}
          ethUsdPremiumPrice={ethUsdPremiumPrice}
          ethUsdPrice={ethUsdPrice}
          loading={rentPriceLoading}
          price={getRentPrice}
        />
      )}
      {releasedDate && getTimeUntilPremium && getPremium ? (
        <PremiumWarning>
          <h2>This name has a temporary premium.</h2>
          <p>
            To prevent a rush to register names with high aas prices, newly
            released names have a temporary premium that starts at $2,000 and
            reduces over 28 days until the premium is gone. Enter the amount
            you're willing to pay as a premium to learn which date to revisit
            the app to register the name. This is because this name was just
            released on{' '}
          </p>
          <LineGraph
            currentDays={10}
            premiumInEth={premiumInEth}
            ethUsdPremiumPrice={ethUsdPremiumPrice}
            startingPriceInEth={2000 / ethUsdPrice}
          />
          <Premium
            handlePremium={handlePremium}
            zeroPremiumDate={formatDate(zeroPremiumDate)}
          />
        </PremiumWarning>
      ) : (
        ''
      )}
      <Explainer
        step={step}
        waitTime={waitTime}
        waitPercentComplete={waitPercentComplete}
      />
      <Progress step={step} waitPercentComplete={waitPercentComplete} />
      <CTA
        waitTime={waitTime}
        incrementStep={incrementStep}
        decrementStep={decrementStep}
        step={step}
        label={domain.label}
        duration={duration}
        secondsPassed={secondsPassed}
        setTimerRunning={setTimerRunning}
        refetch={refetch}
        refetchIsMigrated={refetchIsMigrated}
        isAboveMinDuration={isAboveMinDuration}
        readOnly={readOnly}
        price={getRentPrice}
        ethUsdPrice={!ethUsdPriceLoading && ethUsdPrice}
      />
    </NameRegisterContainer>
  )
}

const NameRegisterDataWrapper = props => {
  return (
    <Query query={GET_MINIMUM_COMMITMENT_AGE}>
      {({ data, loading, error }) => {
        if (loading) return <Loader withWrap={true} large />
        if (error) {
          console.log(error)
        }
        const { getMinimumCommitmentAge } = data
        return <NameRegister waitTime={getMinimumCommitmentAge} {...props} />
      }}
    </Query>
  )
}

export default NameRegisterDataWrapper
