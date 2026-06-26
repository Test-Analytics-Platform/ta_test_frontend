import client from './client.js'

export async function changeStudentPassword(oldPassword, newPassword) {
  const { data } = await client.put('/auth/student-password', {
    old_password: oldPassword,
    new_password: newPassword,
  })
  return data
}
