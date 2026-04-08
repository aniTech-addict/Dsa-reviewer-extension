export const code = `
class Solution {
    public ListNode rotateRight(ListNode head, int k) {
        int len = 0;
        ListNode traveller = head;
        if (traveller == null) {
            return head;
        }

        /*
        * Get the lenght and last node of the LinkedList
        */
        ListNode prev = null;
        while (traveller != null) {
            len++;
            prev = traveller;
            traveller = traveller.next;
        }

        ListNode tail = prev; // store the tail of the LL

        k = k % len;    // figure out the number of actual rotation needed
        if (k == 0) return head;
        // prepare for the next iteration
        prev = null;
        traveller = head;
        ListNode curr = head;

        int index = 0;

        // prev had the new tail
        // curr has the new head
        // intersection points are tail and prevHead
        while (traveller != null) {
            traveller = traveller.next;
            index++;
            if (index > k) {
                prev = curr;
                curr = curr.next;
            }
        }
        
        prev.next = null;

        tail.next = head;
        head = curr;
        return head;

    }
} 
`;