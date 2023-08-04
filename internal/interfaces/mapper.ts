
export interface IMapper<T, G> {
    map(data: T): G[]| Promise<G[]>;
}
