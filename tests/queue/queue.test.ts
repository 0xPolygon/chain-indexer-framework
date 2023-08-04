import { Queue } from "../../dist/internal/queue/queue";

describe("Common Queue class", () => {
    const queue = new Queue();
    beforeEach(() => {
        queue.clear();
    });
    

    describe("enqueue", () => {
        test("Should add a single item to queue.", () => {
            queue.enqueue("test");
            expect(queue.getLength()).toBe(1);
        });

        const cases = [
            "string",
            123,
            new Promise((resolve) => setTimeout(resolve)),
            { test: "test" }
        ];
        test.each(cases)("The item added to the queue should be consistent with the one passed.", (a) => {
            queue.enqueue(a);
            expect(queue.front()).toBe(a);
        });

        test("Item should be added to the end of the queue", () => {
            queue.enqueue("string1");
            queue.enqueue("string2");
            expect(queue.front()).toBe("string1");
        });
    });

    describe("clear", () => {
        test("Should empty the entire queue", () => {
            queue.enqueue("test1");
            queue.enqueue("test2");
            queue.clear();
            expect(queue.getLength()).toBe(0);
        });
    });

    describe("shift", () => {
        test("Should remove only the first item from queue.", () => {
            queue.enqueue("test1");
            queue.enqueue("test2");
            queue.shift();
            expect(queue.getLength()).toBe(1);
            expect(queue.front()).toBe("test2");
        });

        test("Should remove only the first item from queue.", () => {
            queue.enqueue("test1");
            queue.enqueue("test2");
            queue.shift();
            expect(queue.getLength()).toBe(1);
            expect(queue.front()).toBe("test2");
        });

        test("Should return the item being removed", () => {
            queue.enqueue("test1");
            expect(queue.shift()).toBe("test1");
        });
    });

    describe("front", () => {
        test("Should return only the first item in the queue", () => {
            queue.enqueue("test1");
            queue.enqueue("test2");
            expect(queue.front()).toBe("test1");
        });

        test("Should not modify the queue length", () => {
            queue.enqueue("test1");
            queue.enqueue("test2");
            queue.front();
            expect(queue.getLength()).toBe(2);
        });
    });

    describe("isEmpty", () => {
        test("Should return true if the queue is empty and false if not.", () => {
            queue.enqueue("test1");
            queue.enqueue("test2");
            expect(queue.isEmpty()).toBe(false);
            queue.clear();
            expect(queue.isEmpty()).toBe(true);
        });
    });

    describe("getLength", () => {
        test("Should return the correct length of the queue", () => {
            queue.enqueue("test1");
            expect(queue.getLength()).toBe(1);
            queue.enqueue("test2");
            expect(queue.getLength()).toBe(2);
            queue.enqueue("test3");
            expect(queue.getLength()).toBe(3);
        });
    });

});
