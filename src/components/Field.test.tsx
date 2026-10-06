import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Field } from './Field'

describe('<Field />', () => {
  it('links its label to the input', () => {
    render(<Field label="Email" value="" onChange={() => {}} />)
    // getByLabelText only matches if htmlFor/id are wired correctly.
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('shows the current value', () => {
    render(<Field label="Email" value="a@b.com" onChange={() => {}} />)
    expect(screen.getByLabelText('Email')).toHaveValue('a@b.com')
  })

  it('calls onChange with the typed value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Field label="Email" value="" onChange={onChange} />)
    await user.type(screen.getByLabelText('Email'), 'abc')
    expect(onChange).toHaveBeenCalled()
    // The last call carries the newest character ("c").
    expect(onChange).toHaveBeenLastCalledWith('c')
  })

  it('renders the requested input type', () => {
    render(<Field label="Password" type="password" value="" onChange={() => {}} />)
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })
})