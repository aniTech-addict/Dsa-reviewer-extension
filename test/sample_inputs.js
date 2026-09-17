export const code = [

`class Solution {
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
}`,
`
# Definition for a binary tree node.
# class TreeNode(object):
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution(object):
    def postAvg(self, node, count):
        leftSum = 0
        rightSum = 0
        n = 0

        if not node.left and not node.right:
            count[0]+=1
            return [1, node.val]

        if node.left:
            res = self.postAvg(node.left, count)
            leftSum += res[1]
            n += res[0]

        if node.right:
            res = self.postAvg(node.right, count)

            rightSum += res[1]
            n += res[0]

        totalN = n + 1
        totalSum = leftSum + rightSum + node.val
        currAvg = totalSum // totalN

        if node.val == currAvg:
            count[0] += 1

        # print(f"Node: {node.val} currAvg: {currAvg}")

        return [totalN, totalSum]

    def averageOfSubtree(self, root):
        count = [0]
        self.postAvg(root, count)
        return count[0]

`,
`
class Solution:
    def countCommas(self, n: int) -> int:
        
        l = len(str(n))
        # check if len is greater than 0
        # add commas appropriate for that len
        # at every 3 len, add n-999  -> var (999)
        
        var = 999
        output = 0
        while (l>0):
            l -= 3
            output += max(0,n-var)
            var = var*1000 + 999
        return output

`,
`
class Solution {
public:
    bool uniformArray(vector<int>& nums1) {
        
        vector <int> sol;
        int smallest = nums1[0];
        int smallestEven = INT_MAX;
        int smallestOdd = INT_MAX;



        for ( int val: nums1) {
            if (val < smallestOdd && val%2) smallestOdd = val;
            if (val < smallestEven && !val%2) smallestEven = val;
            if (val < smallest) smallest = val;
        }
        
        int oddParity = smallest % 2;

        for (int val: nums1) {
            if ( !oddParity && val % 2 ) {
                if ( !val-smallestOdd ) return false;
            }
        }
        return true;
    }
};
`

];
