/**
 * A simple class that offers methods to create internal buffers and maintain them. 
 */
export class Queue<T> {
    private items: Record<number, Promise<T> | T> = {};
    private head: number = 0;
    private tail: number = 0;

    /**
     * Public method to add an item to the queue. This class only maintains one queue and hence it is important to be careful 
     * while queueing different entities on the same instance un intentionally.  
     * 
     * @param {Promise<T> | T} item - Item to be added to the queue 
     * 
     * @returns {void}
     */
    public enqueue(item: Promise<T> | T): void {
        this.items[this.tail] = item;
        this.tail++;
    }

    /**
     * Returns an item from the beginning(added first) of the queue and removes it from the queue. Returns null if the queue is empty.
     * 
     * @returns {Promise<T> | T | null} - The removed the item.
     */
    public shift(): Promise<T> | T | null {
        if (this.isEmpty()) {
            return null;
        }

        const item = this.items[this.head];
        delete this.items[this.head];
        this.head++;

        return item as Promise<T> | T;
    }

    /**
     * Returns an item from the beginning(added first) + nth - 1 of the queue and removes it along
     * with all other in front of it from the queue. Returns null if the queue is empty or less than the position.
     * 
     * @returns {Promise<T> | T | null} - The removed the item.
     */
    public shiftByN(position: number): Promise<T> | T | null {
        if (this.getLength() < position && position !== 0) {
            return null;
        }

        this.head = this.head + position - 1;
        const item = this.items[this.head];
        for (const key in Object.keys(this.items)) {
            const numericKey = parseInt(key);

            if (numericKey <= this.head) {
                delete this.items[key];
            }
        }
        this.head++;

        return item as Promise<T> | T;
    }

    /**
     * Returns the first item from the queue without removing it.
     * 
     * @returns {Promise<T> | T | null} - The first item in the queue or null if empty. 
     */
    public front(): Promise<T> | T | null {
        if (this.isEmpty()) {
            return null;
        }

        return this.items[this.head];
    }

    /**
     * Method to check if the queue is empty
     * 
     * @returns {boolean} - Returns true if empty and false otherwise.
     */
    public isEmpty(): boolean {
        return this.getLength() == 0;
    }

    /**
     * Method to find the length of the queue. 
     * 
     * @returns {number} - The length of the queue. 
     */
    public getLength(): number {
        return this.tail - this.head;
    }

    /**
     * Removes all the items from the queue.
     * 
     * @returns {number} - The queue length after clearing. 
     */
    public clear(): number {
        this.head = this.tail = 0;
        this.items = {};
        return 0;
    }
}
