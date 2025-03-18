class ApiResponse {
  constructor(statuseCode, data, message = "Success"){
    this.statuseCode = statuseCode;
    this.data = data;
    this.message = message;
    this.success = statuseCode < 400;
  }

  // working across status code which type of status code receive i will handle it
}

export default ApiResponse;