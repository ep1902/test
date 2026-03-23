class dataController {
    constructor() {}
  
    GetData(path, token) {
  
      return fetch(path, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      })
        .then(handleRequest)
        .then((data) => {
          return Promise.resolve({ success: true, data: data });
        })
        .catch((err) => {
          return Promise.reject({ success: false, error: err });
        })
        .finally(() => {});
    }
  
    PostData(path, data, token) {
      return fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(data),
      })
        .then(handleRequest)
        .then((data) => {
          return Promise.resolve({ success: true, data: data });
        })
        .catch((err) => {
          return Promise.reject({ success: false, error: err });
        })
        .finally(() => {});
    }
  
    PutData(path, id, data, token) {
      return fetch(path, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          id: id,
          data: data,
        })
      })
        .then(handleRequest)
        .then((data) => {
          return Promise.resolve({ success: true, data: data });
        })
        .catch((err) => {
          return Promise.reject({ success: false, error: err });
        })
        .finally(() => {});
    }
  
    DeleteData(path, id, token) {
      return fetch(path, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({id})
      })
        .then(handleRequest)
        .then((data) => {
          return Promise.resolve({ success: true, data: data });
        })
        .catch((err) => {
          return Promise.reject({ success: false, error: err });
        })
        .finally(() => {});
    }
  
    PostFile(path, file, token) {
      return fetch(path, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
        body: file,
      })
        .then(handleRequest)
        .then((data) => {
          return Promise.resolve({ success: true, data: data });
        })
        .catch((err) => {
          return Promise.reject({ success: false, error: err });
        })
        .finally(() => {});
    }
  
    FetchFile(path, data, token) {
      return fetch(path, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
        body: data,
      });
    }
  }
  
  async function handleRequest(response) {
    const text = await response.text();
    const data = text && JSON.parse(text);
    if(data !== null && data.data !== undefined && data.data !== null && data.data.access_token !== undefined && data.data.access_token !== null) {
      localStorage.setItem('jwt', data.data.access_token);
    }
  
    if (!response.ok) {
      if (response.status === 401) {
        
        window.location.reload(true);
      }
  
      const error = (data && data.message) || response.statusText;
      return Promise.reject(error);
    }
  
    return data;
  }
  
  export default dataController;