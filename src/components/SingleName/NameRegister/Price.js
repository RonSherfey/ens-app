import React, { useState } from 'react'
import styled from '@emotion/styled/macro'
import { useTranslation } from 'react-i18next'
import mq from 'mediaQuery'
import EthVal from 'ethval'
import { InlineLoader } from 'components/Loader'
import DefaultInput from '../../Forms/Input'
const GWEI = 1000000000
const COMMIT_GAS_WEI = 42000
const REGISTER_GAS_WEI = 240000

const PriceContainer = styled('div')`
  width: 100%;
  ${mq.medium`
    width: auto
  `}
`

const Value = styled('div')`
  font-family: Overpass;
  font-weight: 100;
  font-size: 22px;
  color: #2b2b2b;
  border-bottom: 1px solid #dbdbdb;
  ${mq.small`
    font-size: 28px;
  `}
`

const TotalValue = styled(Value)`
  font-weight: 300;
`

const Description = styled('div')`
  font-family: Overpass;
  font-weight: 300;
  font-size: 14px;
  color: #adbbcd;
  margin-top: 10px;
`

const USD = styled('span')`
  font-size: 22px;
  color: #adbbcd;
  margin-left: 20px;
  ${mq.small`
    font-size: 28px;
  `}
`

const Input = styled(DefaultInput)`
  display: inline-block;
  width: 4em;
  margin-bottom: 0em;
`

const Price = ({
  loading,
  price,
  ethUsdPrice,
  ethUsdPremiumPrice,
  ethUsdPriceLoading,
  initialGasPrice,
  underPremium
}) => {
  const { t } = useTranslation()
  const [gasPrice, setGasPrice] = useState(initialGasPrice)
  const handleGasPrice = e => {
    setGasPrice((e.target.value || 0) * GWEI)
  }

  let ethPrice = <InlineLoader />
  let ethVal, basePrice, withPremium, usdPremium
  if (!loading && price) {
    ethVal = new EthVal(`${price}`).toEth()
    ethPrice = ethVal && ethVal.toFixed(3)
    if (ethUsdPrice && ethUsdPremiumPrice) {
      basePrice = ethVal.mul(ethUsdPrice) - ethUsdPremiumPrice
      withPremium =
        underPremium && ethUsdPremiumPrice
          ? `$${basePrice.toFixed(0)}(+$${ethUsdPremiumPrice.toFixed(2)}) =`
          : null
      usdPremium = ethVal.mul(ethUsdPrice).toFixed(2)
    } else if (ethUsdPrice) {
      usdPremium = ethVal.mul(ethUsdPrice).toFixed(2)
    }
  }
  const commitGas = new EthVal(`${COMMIT_GAS_WEI * gasPrice}`).toEth()
  const registerGas = new EthVal(`${REGISTER_GAS_WEI * gasPrice}`).toEth()
  const gasPriceToGwei = new EthVal(`${gasPrice}`).toGwei()
  const totalGas = commitGas.add(registerGas)
  const totalGasInUsd = totalGas.mul(ethUsdPrice)
  const buffer = ethVal.div(10)
  const total = ethVal.add(buffer).add(totalGas)
  const totalInUsd = total.mul(ethUsdPrice)
  return (
    <>
      <PriceContainer>
        <Value>
          {ethPrice} ETH
          {ethVal && ethUsdPrice && (
            <USD>
              {withPremium}${usdPremium}
              USD
            </USD>
          )}
        </Value>
        <Description>
          {ethUsdPremiumPrice
            ? t('pricer.pricePerAmount')
            : t('pricer.totalPriceLabel')}
        </Description>
      </PriceContainer>
      <PriceContainer>
        <Value>
          {totalGas.toFixed(3)} ETH ({commitGas.toFixed(3)} ETH +{' '}
          {registerGas.toFixed(3)} ETH) when the gas price is{' '}
          <Input value={gasPriceToGwei.toNumber()} onChange={handleGasPrice} />{' '}
          Gwei
          {ethVal && ethUsdPrice && (
            <USD>
              {' '}
              = ${totalGasInUsd.toFixed(2)}
              USD
            </USD>
          )}
        </Value>
        <Description>
          Estimated Gas Price (Step 1 + Step 3). The gas price will flucuate.
        </Description>
      </PriceContainer>
      <PriceContainer>
        <TotalValue>
          {total.toFixed(3)} ETH ({ethVal.toFixed(3)} ETH + {buffer.toFixed(3)}{' '}
          ETH + {totalGas.toFixed(3)} ETH)
          {ethVal && ethUsdPrice && (
            <USD>
              {' '}
              = ${totalInUsd.toFixed(2)}
              USD
            </USD>
          )}
        </TotalValue>
        <Description>
          Estimated Total (Price + 10% buffer + Gas). The buffer is added to
          handle ETH price fluctuation and any unspent will be returned.
        </Description>
      </PriceContainer>
    </>
  )
}

export default Price
