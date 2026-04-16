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

    describe("shiftByN", () => {
        test("Should return the Nth item and advance past the skipped entries", () => {
            ["a", "b", "c", "d", "e"].forEach(v => queue.enqueue(v));
            expect(queue.shiftByN(3)).toBe("c");
            expect(queue.getLength()).toBe(2);
            expect(queue.front()).toBe("d");
        });

        test("Should return null when position exceeds queue length", () => {
            queue.enqueue("a");
            queue.enqueue("b");
            expect(queue.shiftByN(5)).toBe(null);
        });

        test("Should not leak skipped entries after `head` has advanced past the array length", () => {
            // Reproduces the bug where `for...in Object.keys(...)` iterates array
            // indices (0..N-1) instead of actual item keys. The failure only appears
            // once `head` exceeds the current size of the items bag — otherwise the
            // array indices and actual keys coincidentally overlap and nothing leaks.
            // Drive `head` forward with single shifts first, then call shiftByN.
            for (let i = 0; i < 1000; i++) queue.enqueue(`item-${i}`);
            for (let i = 0; i < 500; i++) queue.shift();
            // items bag now holds keys 500..999 (500 entries); head=500.
            queue.shiftByN(200);
            // head becomes 700 — past the 500-length bag. With the bug, the delete
            // loop iterates indices 0..499 which don't exist as keys, so entries
            // 500..699 leak. Logical length is 300; bag should also be 300.
            expect(queue.getLength()).toBe(300);
            expect(Object.keys((queue as unknown as { items: Record<string, unknown> }).items)).toHaveLength(queue.getLength());
        });

        test("Should fully drain internal storage when the queue is empty", () => {
            for (let i = 0; i < 10; i++) queue.enqueue(`item-${i}`);
            queue.shiftByN(10);
            expect(queue.getLength()).toBe(0);
            expect(Object.keys((queue as unknown as { items: Record<string, unknown> }).items)).toHaveLength(0);
        });
    });

});
