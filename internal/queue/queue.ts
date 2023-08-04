/**
 * A simple class that offers methods to create internal buffers and maintain them. 
 */
export class Queue<T> {
    private items: Array<Promise<T> | T> = [];
    
    /**
     * Public method to add an item to the queue. This class only maintains one queue and hence it is important to be careful 
     * while queueing different entities on the same instance un intentionally.  
     * 
     * @param {Promise<T> | T} item - Item to be added to the queue 
     * 
     * @returns {void}
     */
    public enqueue(item: Promise<T> | T): void {
        this.items.push(item);
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

        return this.items.shift() as Promise<T> | T;
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
            
        return this.items[0];
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
        return this.items.length;
    }
    
    /**
     * Removes all the items from the queue.
     * 
     * @returns {number} - The queue length after clearing. 
     */
    public clear(): number {
        return this.items.length = 0;
    }
}
