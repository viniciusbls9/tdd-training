import { set, reset } from 'mockdate'

type EventStatus = {
  status: string
}
class CheckLastEventStatus {
  constructor(private readonly loadLastEventRepository: LoadLastEventRepository) { }
  async perform({ groupId }: { groupId: string }): Promise<EventStatus> {
    const event = await this.loadLastEventRepository.loadLastEvent({ groupId })
    if (event === undefined) return { status: 'done' }
    const now = new Date()
    return event.endDate >= now ? { status: 'active' } : { status: 'inReview' }
  }
}

interface LoadLastEventRepository {
  loadLastEvent: (input: { groupId: string }) => Promise<{ endDate: Date, reviewDurationInHours: number } | undefined>
}

class LoadLastEventRepositorySpy implements LoadLastEventRepository {
  groupId?: string
  callsCount = 0
  output?: { endDate: Date, reviewDurationInHours: number }

  async loadLastEvent({ groupId }: { groupId: string }): Promise<{ endDate: Date, reviewDurationInHours: number } | undefined> {
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
  const groupId = 'any_group_id'

  beforeAll(() => {
    set(new Date())
  })

  afterAll(() => {
    reset()
  })

  test('Should get last event data', async () => {
    const { sut, loadLastEventRepository } = makeSut()

    await sut.perform({ groupId })

    expect(loadLastEventRepository.groupId).toBe(groupId)
    expect(loadLastEventRepository.callsCount).toBe(1)
  })

  test('Should return status done when group has no event', async () => {
    const { sut, loadLastEventRepository } = makeSut()
    loadLastEventRepository.output = undefined

    const eventStatus = await sut.perform({ groupId })

    expect(eventStatus.status).toBe('done')
  })

  test('Should return status active when now is before event end time', async () => {
    const { sut, loadLastEventRepository } = makeSut()
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() + 1),
      reviewDurationInHours: 1
    }

    const eventStatus = await sut.perform({ groupId })

    expect(eventStatus.status).toBe('active')
  })

  test('Should return status active when now is equal to event end time', async () => {
    const { sut, loadLastEventRepository } = makeSut()
    loadLastEventRepository.output = {
      endDate: new Date(),
      reviewDurationInHours: 1
    }

    const eventStatus = await sut.perform({ groupId })

    expect(eventStatus.status).toBe('active')
  })

  test('Should return status inReview when now is after event end time', async () => {
    const { sut, loadLastEventRepository } = makeSut()
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - 1),
      reviewDurationInHours: 1
    }

    const eventStatus = await sut.perform({ groupId })

    expect(eventStatus.status).toBe('inReview')
  })

  test('Should return status inReview when now is before review time', async () => {
    const reviewDurationInHours = 1
    const reviewDurationInMs = reviewDurationInHours * 60 * 60 * 1000
    const { sut, loadLastEventRepository } = makeSut()
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - reviewDurationInMs + 1),
      reviewDurationInHours
    }

    const eventStatus = await sut.perform({ groupId })

    expect(eventStatus.status).toBe('inReview')
  })
})
