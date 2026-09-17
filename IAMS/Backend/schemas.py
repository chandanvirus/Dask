# from pydantic import BaseModel, Field

# class Attendance(BaseModel):
#     employee: str
#     date: str
#     check_in: str
#     check_out: str
#     status: str

#     class Config:
#         orm_mode = True

# class LeaveCreate(BaseModel):
#     employee: str
#     leave_type: str
#     from_date: str
#     to_date: str
#     reason: str


# class EmployeeCreate(BaseModel):
#     name: str
#     email: str
#     department: str
#     role: str
#     salary: int
#     password: str = Field(..., min_length=6, max_length=72)

# class LoginRequest(BaseModel):
#     email: str
#     password: str = Field(..., min_length=6, max_length=72)


from pydantic import BaseModel, Field


# -----------------------
# Attendance Schema
# -----------------------
class Attendance(BaseModel):
    employee: str
    date: str
    check_in: str
    check_out: str
    status: str

    class Config:
        from_attributes = True   # replaces orm_mode in Pydantic v2


# -----------------------
# Leave Schema
# -----------------------
class LeaveCreate(BaseModel):
    employee: str
    leave_type: str
    from_date: str
    to_date: str
    reason: str


# -----------------------
# Employee Schema
# -----------------------
class EmployeeCreate(BaseModel):
    name: str
    email: str
    department: str
    role: str
    salary: int | None = None
    password: str = Field(..., min_length=6, max_length=72)


class EmployeeUpdate(BaseModel):
    name: str
    email: str
    department: str | None = None
    photo: str | None = None


# -----------------------
# Login Request
# -----------------------
class LoginRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6, max_length=72)
    role: str


# -----------------------
# Login Response
# -----------------------
class LoginResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: str
    photo: str | None = None
