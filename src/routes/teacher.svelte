<script context="module">
import { request, gql } from 'graphql-request'

const query = gql`
query {
  teachers(fromZPA: false) {
    fullname
    shortname
    isProf
    isLBA
    isProfHC
    isStaff
    lastSemester
    fk
	id
    email
  }
}
`

export const load = async () => {
    const data = await request('http://localhost:8080/query', query)
    
    return {
        props: {
            data
        }
    }
}

</script>

<script>
    export let data
</script>

<h1>
    Dozenten
</h1>

<ol>
    {#each data.teachers as teacher}
    <li>{teacher.shortname}
        {#if teacher.isProf && teacher.fk == "FK07"}(Prof. FK07){/if}
        <b>{teacher.lastSemester}</b>
    </li>
    {/each}
</ol>