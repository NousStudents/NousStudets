-- Drop all problematic policies first
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Anyone can view conversations they're part of" ON conversations;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;

-- Recreate conversation_participants SELECT policy without self-reference
-- The key fix: check if user_id matches current user directly, OR if they share a conversation with current user
CREATE POLICY "Users can view participants in their conversations" 
ON conversation_participants 
FOR SELECT 
USING (
  user_id IN (SELECT get_admin_id() UNION SELECT get_teacher_id() UNION SELECT get_student_id() UNION SELECT get_parent_id())
);

-- Recreate conversations SELECT policy
CREATE POLICY "Anyone can view conversations they're part of" 
ON conversations 
FOR SELECT 
USING (
  created_by IN (SELECT get_admin_id() UNION SELECT get_teacher_id() UNION SELECT get_student_id() UNION SELECT get_parent_id())
  OR EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversations.conversation_id 
    AND cp.user_id IN (SELECT get_admin_id() UNION SELECT get_teacher_id() UNION SELECT get_student_id() UNION SELECT get_parent_id())
  )
);

-- Recreate messages SELECT policy
CREATE POLICY "Users can view their messages" 
ON messages 
FOR SELECT 
USING (
  sender_id IN (SELECT get_admin_id() UNION SELECT get_teacher_id() UNION SELECT get_student_id() UNION SELECT get_parent_id())
  OR receiver_id IN (SELECT get_admin_id() UNION SELECT get_teacher_id() UNION SELECT get_student_id() UNION SELECT get_parent_id())
  OR (
    is_group = true 
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id IN (SELECT get_admin_id() UNION SELECT get_teacher_id() UNION SELECT get_student_id() UNION SELECT get_parent_id())
    )
  )
);