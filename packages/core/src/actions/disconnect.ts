import { type MutationOptions } from '@tanstack/query-core'

import { type Config, type Connection, type Connector } from '../config.js'
import type { BaseError } from '../errors/base.js'
import { ConnectorNotFoundError } from '../errors/config.js'

export type DisconnectParameters = {
  connector?: Connector | undefined
}

export type DisconnectError = ConnectorNotFoundError | BaseError | Error

export async function disconnect(
  config: Config,
  { connector: connector_ }: DisconnectParameters = {},
) {
  let connector: Connector | undefined
  if (connector_) connector = connector_
  else {
    const { connections, current } = config.state
    const connection = connections.get(current!)
    connector = connection?.connector
  }

  if (!connector) throw new ConnectorNotFoundError()
  const connections = config.state.connections
  if (!connections.has(connector.uid)) throw new ConnectorNotFoundError()

  await connector.disconnect()
  connector.emitter.off('change', config._internal.change)
  connector.emitter.off('disconnect', config._internal.disconnect)
  connector.emitter.on('connect', config._internal.connect)

  connections.delete(connector.uid)

  config.setState((x) => {
    if (connections.size === 0)
      return {
        ...x,
        connections: new Map(),
        current: undefined,
        status: 'disconnected',
      }

    const nextConnection = connections.values().next().value as Connection
    return {
      ...x,
      connections: new Map(connections),
      current: nextConnection.connector.uid,
    }
  })
}

///////////////////////////////////////////////////////////////////////////
// Mutation

export type DisconnectMutationData = void
export type DisconnectMutationVariables = { connector?: Connector } | void
export type DisconnectMutationParameters = { connector?: Connector | undefined }

export const disconnectMutationOptions = (
  config: Config,
  options: DisconnectMutationParameters,
) => {
  const connector = 'connector' in options ? options.connector : undefined
  return {
    ...options,
    mutationFn(variables) {
      const connector_ =
        (variables as DisconnectParameters | undefined)?.connector ?? connector
      return disconnect(config, { connector: connector_ })
    },
    mutationKey: ['disconnect', { connector }],
  } as const satisfies MutationOptions<
    DisconnectMutationData,
    DisconnectError,
    DisconnectMutationVariables
  >
}