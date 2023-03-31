import type { ContractConfig } from 'viem'

import { getClient } from '../../client'
import { watchBlockNumber } from '../network-status/watchBlockNumber'
import type { ReadContractsConfig, ReadContractsResult } from './readContracts'
import { readContracts } from './readContracts'

export type WatchReadContractsConfig<
  TContracts extends ContractConfig[] = ContractConfig[],
  TAllowFailure extends boolean = true,
> = ReadContractsConfig<TContracts, TAllowFailure> & {
  listenToBlock?: boolean
}
export type WatchReadContractsCallback<
  TContracts extends ContractConfig[] = ContractConfig[],
  TAllowFailure extends boolean = true,
> = (results: ReadContractsResult<TContracts, TAllowFailure>) => void

export function watchReadContracts<
  TContracts extends ContractConfig[],
  TAllowFailure extends boolean = true,
>(
  config: WatchReadContractsConfig<TContracts, TAllowFailure>,
  callback: WatchReadContractsCallback<TContracts, TAllowFailure>,
) {
  const client = getClient()

  const handleChange = async () => callback(await readContracts(config))

  const unwatch = config.listenToBlock
    ? watchBlockNumber({ listen: true }, handleChange)
    : undefined
  const unsubscribe = client.subscribe(({ provider }) => provider, handleChange)

  return () => {
    unsubscribe()
    unwatch?.()
  }
}
