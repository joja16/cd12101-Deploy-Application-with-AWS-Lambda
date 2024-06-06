import Axios from 'axios';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT;

export async function getTodos(idToken) {
  console.log('Fetching todos');
  try {
    const response = await Axios.get(`${apiEndpoint}/todos`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    });
    console.log('Todos:', response.data);
    return response.data.items;
  } catch (error) {
    console.error('Error fetching todos:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch todos');
  }
}

export async function createTodo(idToken, newTodo) {
  try {
    const response = await Axios.post(`${apiEndpoint}/todos`, JSON.stringify(newTodo), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    });
    return response.data.item;
  } catch (error) {
    console.error('Error creating todo:', error);
    throw new Error(error.response?.data?.message || 'Failed to create todo');
  }
}

export async function patchTodo(idToken, todoId, updatedTodo) {
  try {
    await Axios.patch(`${apiEndpoint}/todos/${todoId}`, JSON.stringify(updatedTodo), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    throw new Error(error.response?.data?.message || 'Failed to update todo');
  }
}

export async function deleteTodo(idToken, todoId) {
  try {
    await Axios.delete(`${apiEndpoint}/todos/${todoId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete todo');
  }
}

export async function getUploadUrl(idToken, todoId) {
  try {
    const response = await Axios.post(`${apiEndpoint}/todos/${todoId}/attachment`, '', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    });
    return response.data.uploadUrl;
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw new Error(error.response?.data?.message || 'Failed to get upload URL');
  }
}

export async function uploadFile(uploadUrl, file) {
  try {
    await Axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload file');
  }
}
