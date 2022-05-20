import { set, reset } from 'mockdate'
class CheckLastEventStatus {
  constructor(private readonly loadLastEventRepository: LoadLastEventRepository) { }
  async perform(groupId: string): Promise<string> {
    const event = await this.loadLastEventRepository.loadLastEvent(groupId)

    return event === undefined ? 'done' : 'active'
  }
}

interface LoadLastEventRepository {
  loadLastEvent: (groupId: string) => Promise<{ endDate: Date } | undefined>
}

class LoadLastEventRepositorySpy implements LoadLastEventRepository {
  groupId?: string
  callsCount = 0
  output?: { endDate: Date }

  async loadLastEvent(groupId: string): Promise<{ endDate: Date } | undefined> {
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
  beforeAll(() => {
    set(new Date())
  })

  afterAll(() => {
    reset()
  })

  test('Should get last event data', async () => {
    const { sut, loadLastEventRepository } = makeSut()

    await sut.perform('any_group_id')

    expect(loadLastEventRepository.groupId).toBe('any_group_id')
    expect(loadLastEventRepository.callsCount).toBe(1)
  })

  test('Should return status done when group has no event', async () => {
    const { sut, loadLastEventRepository } = makeSut()
    loadLastEventRepository.output = undefined

    const status = await sut.perform('any_group_id')

    expect(status).toBe('done')
  })

  test('Should return status active when now is before event end time', async () => {
    const { sut, loadLastEventRepository } = makeSut()
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() + 1)
    }

    const status = await sut.perform('any_group_id')

    expect(status).toBe('active')
  })
})
