class CheckLastEventStatus {
  constructor(private readonly loadLastEventRepository: LoadLastEventRepository) { }
  async perform(groupId: string): Promise<string> {
    await this.loadLastEventRepository.loadLastEvent(groupId)
    return 'done'
  }
}

interface LoadLastEventRepository {
  loadLastEvent: (groupId: string) => Promise<undefined>
}

class LoadLastEventRepositorySpy implements LoadLastEventRepository {
  groupId?: string
  callsCount = 0
  output: undefined

  async loadLastEvent(groupId: string): Promise<undefined> {
    this.groupId = groupId
    this.callsCount++
    return this.output
  }
}

type SutOutput = {
  sut: CheckLastEventStatus
  loadLastEventRepository: LoadLastEventRepositorySpy
}

const makeSut = (): SutOutput => {
  const loadLastEventRepository = new LoadLastEventRepositorySpy()
  const sut = new CheckLastEventStatus(loadLastEventRepository)
  return { sut, loadLastEventRepository }
}

describe('CheckLastEventStatus', () => {
  test('Should get last event data', async () => {
    const { sut, loadLastEventRepository } = makeSut()

    await sut.perform('any_group_id')

    expect(loadLastEventRepository.groupId).toBe('any_group_id')
    expect(loadLastEventRepository.callsCount).toBe(1)
  })

  test('Should return status done when group has no event', async () => {
    const loadLastEventRepository = new LoadLastEventRepositorySpy()
    loadLastEventRepository.output = undefined
    const sut = new CheckLastEventStatus(loadLastEventRepository)

    const status = await sut.perform('any_group_id')

    expect(status).toBe('done')
  })
})
